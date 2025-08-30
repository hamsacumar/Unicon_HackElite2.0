// Backend/Models/EmailVerification.cs
using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace Backend.Models
{
    public class EmailVerification
    {
        [BsonId]
        [BsonRepresentation(BsonType.ObjectId)]
        public string Id { get; set; } = string.Empty;

        public required string UserId { get; set; }
        public required string Code { get; set; }
        public DateTime Expiry { get; set; }
        public bool IsUsed { get; set; } = false;
        public required string Type { get; set; } // email_verification or password_reset
    }
}