using System;
using System.ComponentModel.DataAnnotations;
using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace Backend.Models
{
    /// <summary>
    /// Represents a notification sent to a user
    /// </summary>
    public class Notification
    {
        [BsonId]
        [BsonRepresentation(BsonType.ObjectId)]
        public string Id { get; set; } = ObjectId.GenerateNewId().ToString();
        
        /// <summary>
        /// When the notification was created
        /// </summary>
        [BsonElement("createdAt")]
        [BsonDateTimeOptions(Kind = DateTimeKind.Utc)]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        /// <summary>
        /// When the notification was last updated
        /// </summary>
        [BsonElement("updatedAt")]
        [BsonDateTimeOptions(Kind = DateTimeKind.Utc)]
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        /// <summary>
        /// The ID of the user who will receive this notification
        /// </summary>
        [Required]
        [BsonElement("userId")]
        [BsonRepresentation(BsonType.ObjectId)]
        public string UserId { get; set; } = null!;

        /// <summary>
        /// Whether the notification has been read by the user
        /// </summary>
        [BsonElement("isRead")]
        public bool IsRead { get; set; } = false;

        /// <summary>
        /// The ID of the organizer who triggered this notification (if applicable)
        /// </summary>
        [BsonElement("organizerId")]
        [BsonRepresentation(BsonType.ObjectId)]
        public string? OrganizerId { get; set; }

        /// <summary>
        /// Category of the notification (e.g., 'event', 'message', 'system')
        /// </summary>
        [StringLength(50)]
        [BsonElement("category")]
        public string? Category { get; set; }

        /// <summary>
        /// Title of the notification
        /// </summary>
        [Required]
        [StringLength(200, ErrorMessage = "Title cannot exceed 200 characters")]
        [BsonElement("title")]
        public string Title { get; set; } = null!;

        /// <summary>
        /// Detailed message content
        /// </summary>
        [StringLength(1000, ErrorMessage = "Message cannot exceed 1000 characters")]
        [BsonElement("message")]
        public string? Message { get; set; }

        /// <summary>
        /// Reference ID for related entity (e.g., event ID, message ID)
        /// </summary>
        [BsonElement("referenceId")]
        public string? ReferenceId { get; set; }

        /// <summary>
        /// ID of the user who triggered this notification
        /// </summary>
        [BsonElement("fromUserId")]
        [BsonRepresentation(BsonType.ObjectId)]
        public string? FromUserId { get; set; }

        /// <summary>
        /// Type of notification (e.g., 'info', 'warning', 'success', 'error')
        /// </summary>
        [BsonElement("type")]
        public string? Type { get; set; }

        /// <summary>
        /// Additional content or data for the notification
        /// </summary>
        [BsonElement("content")]
        public string? Content { get; set; }

        /// <summary>
        /// URL for the notification action (if any)
        /// </summary>
        [Url]
        [BsonElement("actionUrl")]
        public string? ActionUrl { get; set; }
    }
}
