using System;
using System.ComponentModel.DataAnnotations;
using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace Backend.Models
{
    /// <summary>
    /// Represents a user's subscription to notifications from an organizer or category
    /// </summary>
    public class Subscription
    {
        [BsonId]
        [BsonRepresentation(BsonType.ObjectId)]
        public string? Id { get; set; }

        /// <summary>
        /// ID of the user who is subscribing
        /// </summary>
        [Required]
        [BsonElement("userId")]
        public string UserId { get; set; } = null!;

        /// <summary>
        /// ID of the organizer being subscribed to
        /// </summary>
        [Required]
        [BsonElement("organizerId")]
        public string OrganizerId { get; set; } = null!;

        /// <summary>
        /// Optional category filter for the subscription
        /// </summary>
        [StringLength(50)]
        [BsonElement("category")]
        public string? Category { get; set; }

        /// <summary>
        /// Optional specific post ID being subscribed to
        /// </summary>
        [BsonElement("postId")]
        public string? PostId { get; set; }

        /// <summary>
        /// Display title for the subscription
        /// </summary>
        [StringLength(200)]
        [BsonElement("title")]
        public string? Title { get; set; }

        /// <summary>
        /// When the subscription was created
        /// </summary>
        [BsonElement("createdAt")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        /// <summary>
        /// When the subscription was last updated
        /// </summary>
        [BsonElement("updatedAt")]
        public DateTime? UpdatedAt { get; set; }

        /// <summary>
        /// Whether the subscription is active
        /// </summary>
        [BsonElement("isActive")]
        public bool IsActive { get; set; } = true;
    }
}
