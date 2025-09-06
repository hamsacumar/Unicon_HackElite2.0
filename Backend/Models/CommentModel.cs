using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;
using System;
using System.Text.Json.Serialization;

namespace Backend.Models
{
    public class CommentModel
    {
        [BsonId]
        [BsonRepresentation(BsonType.ObjectId)]
        [JsonIgnore]
        public string Id { get; set; } = string.Empty;

        [BsonElement("postId")]
        [JsonIgnore]
        public string PostId { get; set; } = string.Empty;

        [BsonElement("userId")]
        [JsonIgnore]
        public string UserId { get; set; } = string.Empty;

         [BsonElement("username")]
          [JsonIgnore]
public string Username { get; set; } = string.Empty;


        [BsonElement("text")]
        public string Text { get; set; } = string.Empty;

        [BsonElement("createdAt")]
        [JsonIgnore]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

         [BsonElement("userImage")]
           [JsonIgnore]
        public string? UserImage { get; set; }   

    }
}
