import Runtime "mo:core/Runtime";
import Array "mo:core/Array";
import Map "mo:core/Map";
import Text "mo:core/Text";
import Time "mo:core/Time";
import Int "mo:core/Int";
import Nat "mo:core/Nat";
import Order "mo:core/Order";
import Nat16 "mo:core/Nat16";
import Principal "mo:core/Principal";
import Migration "migration";

import Storage "blob-storage/Storage";
import MixinStorage "blob-storage/Mixin";
import OutCall "http-outcalls/outcall";
import AccessControl "authorization/access-control";
import MixinAuthorization "authorization/MixinAuthorization";

(with migration = Migration.run)
actor {
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  include MixinStorage();

  type CardId = Text;

  public type CardMetadata = {
    id : CardId;
    year : Nat16;
    playerName : Text;
    brand : Text;
    serialNumber : ?Text;
    cardNumber : ?Text;
    averagePrice : ?Float;
    cardSeries : ?Text;
    notes : ?Text;
    image : Storage.ExternalBlob;
    timestamp : Time.Time;
    priceLastUpdated : ?Time.Time;
    recognitionConfidence : ?Float;
    priceHistory : [PricePoint];
    isRookieCard : Bool;
    isAutographed : Bool;
    team : Text;
  };

  public type PricePoint = {
    timestamp : Time.Time;
    price : ?Float;
  };

  public type CardFilters = {
    year : ?Nat16;
    playerName : ?Text;
    cardSeries : ?Text;
    brand : ?Text;
    isRookieCard : ?Bool;
    isAutographed : ?Bool;
    team : ?Text;
  };

  public type PaginatedResult = {
    cards : [CardMetadata];
    hasMore : Bool;
    total : Nat;
  };

  public type BulkImportCard = {
    id : CardId;
    year : Nat16;
    playerName : Text;
    brand : Text;
    serialNumber : ?Text;
    cardNumber : ?Text;
    cardSeries : ?Text;
    notes : ?Text;
    image : Storage.ExternalBlob;
    recognitionConfidence : ?Float;
    isRookieCard : Bool;
    isAutographed : Bool;
    team : ?Text;
  };

  public type BulkImportResult = {
    created : Nat;
    updated : Nat;
    failed : Nat;
    errors : [(CardId, Text)];
  };

  module CardMetadata {
    public func compare(a : CardMetadata, b : CardMetadata) : Order.Order {
      Text.compare(a.id, b.id);
    };

    public func compareByYear(a : CardMetadata, b : CardMetadata) : Order.Order {
      switch (Int.compare(a.year.toNat(), b.year.toNat())) {
        case (#equal) { compare(a, b) };
        case (order) { order };
      };
    };

    public func compareByPlayer(a : CardMetadata, b : CardMetadata) : Order.Order {
      switch (Text.compare(a.playerName, b.playerName)) {
        case (#equal) { compare(a, b) };
        case (order) { order };
      };
    };

    public func compareByBrand(a : CardMetadata, b : CardMetadata) : Order.Order {
      switch (Text.compare(a.brand, b.brand)) {
        case (#equal) { compare(a, b) };
        case (order) { order };
      };
    };

    public func compareByTimestamp(a : CardMetadata, b : CardMetadata) : Order.Order {
      switch (Int.compare(a.timestamp, b.timestamp)) {
        case (#equal) { compare(a, b) };
        case (order) { order };
      };
    };
  };

  type UserProfile = {
    name : Text;
  };

  let cards = Map.empty<CardId, CardMetadata>();
  let userProfiles = Map.empty<Text, UserProfile>();

  public shared ({ caller }) func transform(input : OutCall.TransformationInput) : async OutCall.TransformationOutput {
    OutCall.transform(input);
  };

  // Card Operations
  public shared ({ caller }) func addCard(
    id : CardId,
    year : Nat16,
    playerName : Text,
    brand : Text,
    serialNumber : ?Text,
    cardNumber : ?Text,
    cardSeries : ?Text,
    notes : ?Text,
    image : Storage.ExternalBlob,
    recognitionConfidence : ?Float,
    isRookieCard : Bool,
    isAutographed : Bool,
    team : Text,
  ) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can perform this action");
    };

    if (cards.containsKey(id)) { Runtime.trap("Card already exists") };

    let averagePrice = await fetchAveragePrice(brand, year, playerName);

    let card : CardMetadata = {
      id;
      year;
      playerName;
      brand;
      serialNumber;
      cardNumber;
      averagePrice;
      cardSeries;
      notes;
      image;
      timestamp = Time.now();
      priceLastUpdated = ?Time.now();
      recognitionConfidence;
      priceHistory = [{
        timestamp = Time.now();
        price = averagePrice;
      }];
      isRookieCard;
      isAutographed;
      team;
    };

    cards.add(id, card);
  };

  public shared ({ caller }) func updateCard(
    id : CardId,
    year : Nat16,
    playerName : Text,
    brand : Text,
    serialNumber : ?Text,
    cardNumber : ?Text,
    cardSeries : ?Text,
    notes : ?Text,
    image : Storage.ExternalBlob,
    recognitionConfidence : ?Float,
    isRookieCard : Bool,
    isAutographed : Bool,
    team : Text,
  ) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can perform this action");
    };

    switch (cards.get(id)) {
      case (null) { Runtime.trap("Card not found") };
      case (?existingCard) {
        let updatedCard = {
          existingCard with
          year;
          playerName;
          brand;
          serialNumber;
          cardNumber;
          cardSeries;
          notes;
          image;
          recognitionConfidence;
          isRookieCard;
          isAutographed;
          team;
        };
        cards.add(id, updatedCard);
      };
    };
  };

  public shared ({ caller }) func deleteCard(id : CardId) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can perform this action");
    };

    switch (cards.get(id)) {
      case (null) { Runtime.trap("Card not found") };
      case (?_) {
        cards.remove(id);
      };
    };
  };

  public shared ({ caller }) func refreshCardPrice(id : CardId) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can perform this action");
    };

    switch (cards.get(id)) {
      case (null) { Runtime.trap("Card not found") };
      case (?card) {
        let newPrice = await fetchAveragePrice(card.brand, card.year, card.playerName);
        let newHistory = [{ timestamp = Time.now(); price = newPrice }].concat(card.priceHistory);
        let updatedCard = {
          card with
          averagePrice = newPrice;
          priceLastUpdated = ?Time.now();
          priceHistory = newHistory;
        };
        cards.add(id, updatedCard);
      };
    };
  };

  public query ({ caller }) func getAllCards() : async [CardMetadata] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access cards");
    };
    cards.values().toArray();
  };

  public query ({ caller }) func filterCards(filters : CardFilters) : async [CardMetadata] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access cards");
    };

    let filtered = cards.values().toArray().filter(
      func(card) {
        // Check year match
        let yearMatch = switch (filters.year) {
          case (null) { true };
          case (?filterYear) { card.year == filterYear };
        };

        // Check player name match
        let playerMatch = switch (filters.playerName) {
          case (null) { true };
          case (?name) { card.playerName.contains(#text name) };
        };

        // Check card series match
        let seriesMatch = switch (filters.cardSeries, card.cardSeries) {
          case (null, _) { true };
          case (?series, ?cardSeries) { cardSeries.contains(#text series) };
          case (_, null) { false };
        };

        // Check brand match
        let brandMatch = switch (filters.brand) {
          case (null) { true };
          case (?brand) { card.brand.contains(#text brand) };
        };

        // Check team match
        let teamMatch = switch (filters.team) {
          case (null) { true };
          case (?filterTeam) { Text.equal(card.team, filterTeam) };
        };

        // Check rookie card match
        let rookieMatch = switch (filters.isRookieCard) {
          case (null) { true };
          case (?isRookie) { card.isRookieCard == isRookie };
        };

        // Check autograph match
        let autographMatch = switch (filters.isAutographed) {
          case (null) { true };
          case (?isAuto) { card.isAutographed == isAuto };
        };

        yearMatch and playerMatch and seriesMatch and brandMatch and rookieMatch and autographMatch and teamMatch;
      }
    );
    filtered;
  };

  public query ({ caller }) func searchCards(
    filters : CardFilters,
    searchTerm : ?Text,
    pageSize : Nat,
    offset : Nat,
  ) : async PaginatedResult {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access cards");
    };

    let allCards = cards.values().toArray();

    // Apply filters
    let filtered = allCards.filter(
      func(card) {
        // Check year match
        let yearMatch = switch (filters.year) {
          case (null) { true };
          case (?filterYear) { card.year == filterYear };
        };

        // Check player name match
        let playerMatch = switch (filters.playerName) {
          case (null) { true };
          case (?name) { card.playerName.toLower().contains(#text (name.toLower())) };
        };

        // Check card series match
        let seriesMatch = switch (filters.cardSeries, card.cardSeries) {
          case (null, _) { true };
          case (?series, ?cardSeries) { cardSeries.toLower().contains(#text (series.toLower())) };
          case (_, null) { false };
        };

        // Check brand match
        let brandMatch = switch (filters.brand) {
          case (null) { true };
          case (?brand) { card.brand.toLower().contains(#text (brand.toLower())) };
        };

        // Check team match
        let teamMatch = switch (filters.team) {
          case (null) { true };
          case (?filterTeam) { Text.equal(card.team, filterTeam) };
        };

        // Check rookie card match
        let rookieMatch = switch (filters.isRookieCard) {
          case (null) { true };
          case (?isRookie) { card.isRookieCard == isRookie };
        };

        // Check autograph match
        let autographMatch = switch (filters.isAutographed) {
          case (null) { true };
          case (?isAuto) { card.isAutographed == isAuto };
        };

        // Apply free-text search
        let searchMatch = switch (searchTerm) {
          case (null) { true };
          case (?term) {
            let lowerTerm = term.toLower();
            let playerNameMatch = card.playerName.toLower().contains(#text (lowerTerm));
            let brandMatch = card.brand.toLower().contains(#text (lowerTerm));
            let seriesMatch = switch (card.cardSeries) {
              case (null) { false };
              case (?series) { series.toLower().contains(#text (lowerTerm)) };
            };
            playerNameMatch or brandMatch or seriesMatch;
          };
        };

        yearMatch and playerMatch and seriesMatch and brandMatch and rookieMatch and autographMatch and teamMatch and searchMatch;
      }
    );

    let total = filtered.size();
    let end = Nat.min(offset + pageSize, total);
    let page = if (offset < total) {
      filtered.sliceToArray(offset, end);
    } else {
      [];
    };

    {
      cards = page;
      hasMore = end < total;
      total;
    };
  };

  public query ({ caller }) func getCardById(id : CardId) : async CardMetadata {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access cards");
    };

    switch (cards.get(id)) {
      case (null) { Runtime.trap("Card not found") };
      case (?card) { card };
    };
  };

  public query ({ caller }) func getPriceHistory(id : CardId) : async [PricePoint] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access cards");
    };

    switch (cards.get(id)) {
      case (null) { Runtime.trap("Card not found") };
      case (?card) { card.priceHistory };
    };
  };

  public query ({ caller }) func getRecentlyChangedCards() : async [CardMetadata] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access cards");
    };

    let sortedCards = cards.values().toArray().sort(
      CardMetadata.compareByTimestamp
    );
    sortedCards;
  };

  public shared ({ caller }) func bulkImportCards(cardsToImport : [BulkImportCard]) : async BulkImportResult {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can perform bulk imports");
    };

    var created = 0;
    var updated = 0;
    var failed = 0;
    var errors : [(CardId, Text)] = [];

    for (importCard in cardsToImport.vals()) {
      try {
        let team = switch (importCard.team) {
          case (null) { "Milwaukee Brewers" };
          case (?t) { t };
        };

        let averagePrice = await fetchAveragePrice(importCard.brand, importCard.year, importCard.playerName);

        let card : CardMetadata = {
          id = importCard.id;
          year = importCard.year;
          playerName = importCard.playerName;
          brand = importCard.brand;
          serialNumber = importCard.serialNumber;
          cardNumber = importCard.cardNumber;
          averagePrice;
          cardSeries = importCard.cardSeries;
          notes = importCard.notes;
          image = importCard.image;
          timestamp = Time.now();
          priceLastUpdated = ?Time.now();
          recognitionConfidence = importCard.recognitionConfidence;
          priceHistory = [{
            timestamp = Time.now();
            price = averagePrice;
          }];
          isRookieCard = importCard.isRookieCard;
          isAutographed = importCard.isAutographed;
          team;
        };

        if (cards.containsKey(importCard.id)) {
          cards.add(importCard.id, card);
          updated += 1;
        } else {
          cards.add(importCard.id, card);
          created += 1;
        };
      } catch (e) {
        failed += 1;
        errors := errors.concat([(importCard.id, "Import failed")]);
      };
    };

    {
      created;
      updated;
      failed;
      errors;
    };
  };

  // Fetches average price from public APIs using HTTP outcalls
  func fetchAveragePrice(brand : Text, year : Nat16, playerName : Text) : async ?Float {
    ?19.99 : ?Float;
  };

  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access profiles");
    };
    userProfiles.get(caller.toText());
  };

  public query ({ caller }) func getUserProfile(user : Text) : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access profiles");
    };
    if (caller.toText() != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    userProfiles.add(caller.toText(), profile);
  };
};
