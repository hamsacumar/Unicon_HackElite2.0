using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;
using System;

namespace Backend.Models
{
    public class Message
    {
        [BsonId]
        [BsonRepresentation(BsonType.ObjectId)]
        public string? Id { get; set; }  // Nullable, let Mongo generate

        [BsonElement("conversationId")]
        public string ConversationId { get; set; } = null!;

        [BsonElement("senderId")]
        public string SenderId { get; set; } = null!;

        [BsonElement("senderUsername")]
        public string SenderUsername { get; set; } = null!;

        [BsonElement("recipientId")]
        public string RecipientId { get; set; } = null!;

        [BsonElement("text")]
        public string Text { get; set; } = null!;

        [BsonElement("timestamp")]
        public DateTime Timestamp { get; set; } = DateTime.UtcNow;

        [BsonElement("status")]
        public string Status { get; set; } = "sent";
    }
}
