using MongoDB.Bson.Serialization.Attributes;
using System.Text.Json.Serialization;

namespace Backend.Models
{
    public class EventDto
    {
        [BsonElement("id")]                 
        [JsonPropertyName("id")]
        public string Id { get; set; } = null!;   // guaranteed string from $toString

        [BsonElement("title")]
        [JsonPropertyName("title")]
        public string Title { get; set; } = null!;

        [BsonElement("description")]
        [JsonPropertyName("description")]
        public string Description { get; set; } = null!;

        [BsonElement("category")]
        [JsonPropertyName("category")]
        public string Category { get; set; } = null!;

        [BsonElement("imageUrl")]
        [JsonPropertyName("imageUrl")]
        public string? ImageUrl { get; set; }

        [BsonElement("userId")]
        [JsonPropertyName("userId")]
        public string UserId { get; set; } = null!;  // guaranteed string from $toString

        [BsonElement("username")]
        [JsonPropertyName("username")]
        public string Username { get; set; } = null!;
    }
}
