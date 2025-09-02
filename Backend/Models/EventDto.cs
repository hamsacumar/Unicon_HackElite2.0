using System.Text.Json.Serialization;

namespace Backend.Models
{
    public class EventDto
    {
        [JsonPropertyName("id")]
        public string? Id { get; set; }

        [JsonPropertyName("title")]
        public string Title { get; set; } = null!;

        [JsonPropertyName("description")]
        public string Description { get; set; } = null!;

        [JsonPropertyName("category")]
        public string Category { get; set; } = null!;

        [JsonPropertyName("imageUrl")]
        public string? ImageUrl { get; set; }
    }
}
