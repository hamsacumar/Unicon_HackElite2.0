using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace Backend.Models
{
    [BsonIgnoreExtraElements] // ignore all other fields we don't care about
    public class profileDetails
    {
        [BsonId]
        [BsonRepresentation(BsonType.ObjectId)] 
        public string Id { get; set; } = string.Empty;

        [BsonElement("Username")] // map MongoDB "Username" to this property
        public string Username { get; set; } = string.Empty;

        public string Description { get; set; } = string.Empty;
    }
}
