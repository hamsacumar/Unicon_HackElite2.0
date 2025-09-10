using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;


public class CommentModel
{
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    public string Id { get; set; } = string.Empty;

    [BsonElement("postId")]
    [BsonRepresentation(BsonType.ObjectId)]
    public string PostId { get; set; } = string.Empty;

    [BsonElement("userId")]
    [BsonRepresentation(BsonType.ObjectId)]
    public string UserId { get; set; } = string.Empty;

    [BsonElement("username")]
    public string Username { get; set; } = string.Empty;

    [BsonElement("userImage")]
    public string? UserImage { get; set; }

    [BsonElement("text")]
    public string Text { get; set; } = string.Empty;

    [BsonElement("createdAt")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
