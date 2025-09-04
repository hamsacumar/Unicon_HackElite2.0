using MongoDB.Bson.Serialization.Attributes;
using System.Text.Json.Serialization;

namespace Backend.Models
{
    public class EventDto
    {
        [BsonElement("id")]                 // maps aggregation result "id" to this property
        [JsonPropertyName("id")]
        public string? Id { get; set; }

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
        public string UserId { get; set; } = null!;

        [BsonElement("username")]
        [JsonPropertyName("username")]
        public string Username { get; set; } = null!;

        
    }
}
