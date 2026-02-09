import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Download, Upload, FileText, Image as ImageIcon, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import { useBulkImportCards } from '@/hooks/useQueries';
import { ExternalBlob } from '@/backend';
import type { BulkImportCard } from '@/backend';
import { toast } from 'sonner';

interface CSVRow {
  id?: string;
  year?: string;
  playerName?: string;
  brand?: string;
  serialNumber?: string;
  cardNumber?: string;
  cardSeries?: string;
  notes?: string;
  imageFilename?: string;
  isRookieCard?: string;
  isAutographed?: string;
  team?: string;
}

export default function ImportPage() {
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [importResult, setImportResult] = useState<{
    created: number;
    updated: number;
    failed: number;
    errors: Array<[string, string]>;
  } | null>(null);

  const csvInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const bulkImport = useBulkImportCards();

  const downloadTemplate = () => {
    const template = `id,year,playerName,brand,serialNumber,cardNumber,cardSeries,notes,imageFilename,isRookieCard,isAutographed,team
card-001,1989,Robin Yount,Topps,,"#500",Base Set,Hall of Famer,yount-1989.jpg,false,false,Milwaukee Brewers
card-002,2011,Ryan Braun,Topps Chrome,15/25,"#1",Refractor,Autographed rookie,braun-2011.jpg,true,true,Milwaukee Brewers`;

    const blob = new Blob([template], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'brewers-cards-template.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Template downloaded');
  };

  const downloadErrorReport = () => {
    if (!importResult || importResult.errors.length === 0) return;

    const errorCsv = ['Card ID,Error\n', ...importResult.errors.map(([id, error]) => `"${id}","${error}"`)].join('\n');
    const blob = new Blob([errorCsv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'import-errors.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Error report downloaded');
  };

  const handleCsvChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCsvFile(file);
      setImportResult(null);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setImageFiles(files);
    setImportResult(null);
  };

  const parseCSV = (text: string): CSVRow[] => {
    const lines = text.split('\n').filter(line => line.trim());
    if (lines.length < 2) return [];

    const headers = lines[0].split(',').map(h => h.trim());
    const rows: CSVRow[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim().replace(/^"|"$/g, ''));
      const row: CSVRow = {};
      headers.forEach((header, index) => {
        if (values[index]) {
          row[header as keyof CSVRow] = values[index];
        }
      });
      rows.push(row);
    }

    return rows;
  };

  const handleImport = async () => {
    if (!csvFile) {
      toast.error('Please select a CSV file');
      return;
    }

    if (imageFiles.length === 0) {
      toast.error('Please select at least one image file');
      return;
    }

    setIsProcessing(true);
    setUploadProgress(0);
    setImportResult(null);

    try {
      // Read CSV
      const csvText = await csvFile.text();
      const rows = parseCSV(csvText);

      if (rows.length === 0) {
        toast.error('CSV file is empty or invalid');
        setIsProcessing(false);
        return;
      }

      // Create image map
      const imageMap = new Map<string, File>();
      imageFiles.forEach(file => {
        imageMap.set(file.name, file);
      });

      // Process rows
      const cardsToImport: BulkImportCard[] = [];
      const errors: Array<[string, string]> = [];

      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const progress = Math.round(((i + 1) / rows.length) * 50);
        setUploadProgress(progress);

        try {
          // Validate required fields
          if (!row.id || !row.year || !row.playerName || !row.brand || !row.imageFilename) {
            errors.push([row.id || `row-${i + 1}`, 'Missing required fields (id, year, playerName, brand, imageFilename)']);
            continue;
          }

          // Find image
          const imageFile = imageMap.get(row.imageFilename);
          if (!imageFile) {
            errors.push([row.id, `Image file not found: ${row.imageFilename}`]);
            continue;
          }

          // Parse year
          const year = parseInt(row.year);
          if (isNaN(year) || year < 1800 || year > new Date().getFullYear() + 1) {
            errors.push([row.id, `Invalid year: ${row.year}`]);
            continue;
          }

          // Convert image to blob
          const arrayBuffer = await imageFile.arrayBuffer();
          const uint8Array = new Uint8Array(arrayBuffer);
          const imageBlob = ExternalBlob.fromBytes(uint8Array);

          // Parse boolean fields
          const isRookieCard = row.isRookieCard?.toLowerCase() === 'true';
          const isAutographed = row.isAutographed?.toLowerCase() === 'true';

          cardsToImport.push({
            id: row.id,
            year,
            playerName: row.playerName,
            brand: row.brand,
            serialNumber: row.serialNumber || undefined,
            cardNumber: row.cardNumber || undefined,
            cardSeries: row.cardSeries || undefined,
            notes: row.notes || undefined,
            image: imageBlob,
            recognitionConfidence: undefined,
            isRookieCard,
            isAutographed,
            team: row.team || undefined,
          });
        } catch (error) {
          errors.push([row.id || `row-${i + 1}`, `Processing error: ${error}`]);
        }
      }

      if (cardsToImport.length === 0) {
        toast.error('No valid cards to import');
        setImportResult({
          created: 0,
          updated: 0,
          failed: errors.length,
          errors,
        });
        setIsProcessing(false);
        return;
      }

      // Import cards
      setUploadProgress(60);
      const result = await bulkImport.mutateAsync(cardsToImport);

      setUploadProgress(100);
      setImportResult({
        created: Number(result.created),
        updated: Number(result.updated),
        failed: Number(result.failed) + errors.length,
        errors: [...errors, ...result.errors],
      });

      if (Number(result.created) > 0 || Number(result.updated) > 0) {
        toast.success(`Import complete! ${result.created} created, ${result.updated} updated`);
      }

      if (errors.length > 0 || Number(result.failed) > 0) {
        toast.warning(`${errors.length + Number(result.failed)} cards failed to import`);
      }
    } catch (error) {
      console.error('Import error:', error);
      toast.error('Import failed. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const resetForm = () => {
    setCsvFile(null);
    setImageFiles([]);
    setImportResult(null);
    setUploadProgress(0);
    if (csvInputRef.current) csvInputRef.current.value = '';
    if (imageInputRef.current) imageInputRef.current.value = '';
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-brewers-navy mb-2">Bulk Import Cards</h1>
          <p className="text-muted-foreground">
            Import multiple Milwaukee Brewers cards at once using a CSV file and images
          </p>
        </div>

        <div className="space-y-6">
          {/* Template Download */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Download className="h-5 w-5 text-brewers-gold" />
                Step 1: Download Template
              </CardTitle>
              <CardDescription>
                Download the CSV template to see the required format for your card data
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                onClick={downloadTemplate}
                variant="outline"
                className="border-brewers-navy text-brewers-navy hover:bg-brewers-navy hover:text-white"
              >
                <Download className="mr-2 h-4 w-4" />
                Download CSV Template
              </Button>
            </CardContent>
          </Card>

          {/* CSV Upload */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-brewers-gold" />
                Step 2: Upload CSV File
              </CardTitle>
              <CardDescription>
                Upload your completed CSV file with card metadata
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="csv-upload">CSV File</Label>
                  <input
                    ref={csvInputRef}
                    id="csv-upload"
                    type="file"
                    accept=".csv"
                    onChange={handleCsvChange}
                    className="mt-2 block w-full text-sm text-muted-foreground file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-brewers-gold file:text-brewers-navy hover:file:bg-brewers-gold/90 cursor-pointer"
                  />
                </div>
                {csvFile && (
                  <Alert>
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <AlertDescription>
                      CSV file selected: <strong>{csvFile.name}</strong>
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Image Upload */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ImageIcon className="h-5 w-5 text-brewers-gold" />
                Step 3: Upload Card Images
              </CardTitle>
              <CardDescription>
                Upload all card images referenced in your CSV file. Image filenames must match the imageFilename column.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="image-upload">Card Images</Label>
                  <input
                    ref={imageInputRef}
                    id="image-upload"
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageChange}
                    className="mt-2 block w-full text-sm text-muted-foreground file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-brewers-gold file:text-brewers-navy hover:file:bg-brewers-gold/90 cursor-pointer"
                  />
                </div>
                {imageFiles.length > 0 && (
                  <Alert>
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <AlertDescription>
                      <strong>{imageFiles.length}</strong> image{imageFiles.length !== 1 ? 's' : ''} selected
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Import Button */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5 text-brewers-gold" />
                Step 4: Import Cards
              </CardTitle>
              <CardDescription>
                Review your selections and start the import process
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {isProcessing && (
                  <div className="space-y-2">
                    <Progress value={uploadProgress} className="h-2" />
                    <p className="text-sm text-muted-foreground text-center">
                      Processing... {uploadProgress}%
                    </p>
                  </div>
                )}

                <div className="flex gap-3">
                  <Button
                    onClick={handleImport}
                    disabled={!csvFile || imageFiles.length === 0 || isProcessing}
                    className="bg-brewers-navy hover:bg-brewers-navy/90 text-white flex-1"
                  >
                    {isProcessing ? (
                      <>
                        <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                        Importing...
                      </>
                    ) : (
                      <>
                        <Upload className="mr-2 h-4 w-4" />
                        Start Import
                      </>
                    )}
                  </Button>
                  {(csvFile || imageFiles.length > 0) && !isProcessing && (
                    <Button
                      onClick={resetForm}
                      variant="outline"
                      className="border-brewers-navy text-brewers-navy hover:bg-brewers-navy hover:text-white"
                    >
                      Reset
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Results */}
          {importResult && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-brewers-gold" />
                  Import Results
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center p-4 rounded-lg bg-green-50 border border-green-200">
                      <CheckCircle2 className="h-8 w-8 text-green-600 mx-auto mb-2" />
                      <p className="text-2xl font-bold text-green-700">{importResult.created}</p>
                      <p className="text-sm text-green-600">Created</p>
                    </div>
                    <div className="text-center p-4 rounded-lg bg-blue-50 border border-blue-200">
                      <CheckCircle2 className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                      <p className="text-2xl font-bold text-blue-700">{importResult.updated}</p>
                      <p className="text-sm text-blue-600">Updated</p>
                    </div>
                    <div className="text-center p-4 rounded-lg bg-red-50 border border-red-200">
                      <XCircle className="h-8 w-8 text-red-600 mx-auto mb-2" />
                      <p className="text-2xl font-bold text-red-700">{importResult.failed}</p>
                      <p className="text-sm text-red-600">Failed</p>
                    </div>
                  </div>

                  {importResult.errors.length > 0 && (
                    <div className="space-y-2">
                      <Alert variant="destructive">
                        <XCircle className="h-4 w-4" />
                        <AlertDescription>
                          {importResult.errors.length} card{importResult.errors.length !== 1 ? 's' : ''} failed to import
                        </AlertDescription>
                      </Alert>
                      <Button
                        onClick={downloadErrorReport}
                        variant="outline"
                        size="sm"
                        className="w-full"
                      >
                        <Download className="mr-2 h-4 w-4" />
                        Download Error Report
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}
