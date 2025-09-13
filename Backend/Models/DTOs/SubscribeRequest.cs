using System.ComponentModel.DataAnnotations;

namespace Backend.Models.Dtos
{
    /// <summary>
    /// Request model for subscribing to notifications
    /// </summary>
    public class SubscribeRequest
    {
        /// <summary>
        /// ID of the organizer to subscribe to
        /// </summary>
        [Required(ErrorMessage = "Organizer ID is required")]
        public string OrganizerId { get; set; } = null!;

        /// <summary>
        /// Optional category to filter subscriptions
        /// </summary>
        [StringLength(50, ErrorMessage = "Category cannot exceed 50 characters")]
        public string? Category { get; set; }

        /// <summary>
        /// Optional post ID for post-specific subscriptions
        /// </summary>
        public string? PostId { get; set; }

        /// <summary>
        /// Optional title for the subscription
        /// </summary>
        [StringLength(200, ErrorMessage = "Title cannot exceed 200 characters")]
        public string? Title { get; set; }
    }
}
