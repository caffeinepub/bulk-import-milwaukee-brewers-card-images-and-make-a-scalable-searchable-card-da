import Map "mo:core/Map";
import Nat16 "mo:core/Nat16";
import Time "mo:core/Time";

module {
  type OldCard = {
    id : Text;
    year : Nat16;
    playerName : Text;
    brand : Text;
    serialNumber : ?Text;
    cardNumber : ?Text;
    averagePrice : ?Float;
    cardSeries : ?Text;
    notes : ?Text;
    image : Blob;
    timestamp : Time.Time;
    priceLastUpdated : ?Time.Time;
    recognitionConfidence : ?Float;
    priceHistory : [PricePoint];
    isRookieCard : Bool;
    isAutographed : Bool;
  };

  type OldActor = {
    cards : Map.Map<Text, OldCard>;
    userProfiles : Map.Map<Text, OldUserProfile>;
  };

  type OldUserProfile = {
    name : Text;
  };

  type PricePoint = {
    timestamp : Time.Time;
    price : ?Float;
  };

  type NewCard = {
    id : Text;
    year : Nat16;
    playerName : Text;
    brand : Text;
    serialNumber : ?Text;
    cardNumber : ?Text;
    averagePrice : ?Float;
    cardSeries : ?Text;
    notes : ?Text;
    image : Blob;
    timestamp : Time.Time;
    priceLastUpdated : ?Time.Time;
    recognitionConfidence : ?Float;
    priceHistory : [PricePoint];
    isRookieCard : Bool;
    isAutographed : Bool;
    team : Text;
  };

  type NewActor = {
    cards : Map.Map<Text, NewCard>;
    userProfiles : Map.Map<Text, OldUserProfile>;
  };

  public func run(old : OldActor) : NewActor {
    let newCards = old.cards.map<Text, OldCard, NewCard>(
      func(_id, oldCard) {
        { oldCard with team = "Milwaukee Brewers" };
      }
    );
    { old with cards = newCards };
  };
};
