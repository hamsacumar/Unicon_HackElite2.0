// Models/Message.cs
using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace Backend.Models
{
    public class Message
    {
        [BsonId]
        [BsonRepresentation(BsonType.ObjectId)]
        public required string Id { get; set; }

        [BsonElement("senderId")]
        public required string  SenderId { get; set; }   // UserId of sender

        [BsonElement("senderUsername")]
        public required string SenderUsername { get; set; } // Username of sender

        [BsonElement("receiverId")]
        public required string ReceiverId { get; set; } // UserId of receiver

        [BsonElement("text")]
        public required string Text { get; set; }

        [BsonElement("status")]
        public string Status { get; set; } = "unseen"; // seen/unseen

        [BsonElement("timestamp")]
        public DateTime Timestamp { get; set; } = DateTime.UtcNow;

        [BsonElement("replyToId")]
        public string? ReplyToId { get; set; } = null;
        public object? Content { get; internal set; }
    }
}
