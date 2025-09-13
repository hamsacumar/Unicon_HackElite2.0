using System.ComponentModel.DataAnnotations;

namespace Backend.Models.Dtos
{
    /// <summary>
    /// Request model for sending a notification
    /// </summary>
    public class SendNotificationRequest
    {
        /// <summary>
        /// ID of the user who will receive the notification
        /// </summary>
        [Required(ErrorMessage = "User ID is required")]
        public string UserId { get; set; } = null!;

        /// <summary>
        /// ID of the organizer related to the notification (optional)
        /// </summary>
        public string? OrganizerId { get; set; }

        /// <summary>
        /// Category of the notification (e.g., 'event', 'message', 'system')
        /// </summary>
        [StringLength(50, ErrorMessage = "Category cannot exceed 50 characters")]
        public string? Category { get; set; }

        /// <summary>
        /// Title of the notification
        /// </summary>
        [Required(ErrorMessage = "Title is required")]
        [StringLength(200, ErrorMessage = "Title cannot exceed 200 characters")]
        public string Title { get; set; } = null!;

        /// <summary>
        /// Detailed message content
        /// </summary>
        [StringLength(1000, ErrorMessage = "Message cannot exceed 1000 characters")]
        public string? Message { get; set; }

        /// <summary>
        /// Type of notification (e.g., 'info', 'warning', 'success', 'error')
        /// </summary>
        [StringLength(50, ErrorMessage = "Type cannot exceed 50 characters")]
        public string? Type { get; set; } = "info";

        /// <summary>
        /// Reference ID for related entity (e.g., event ID, message ID)
        /// </summary>
        public string? ReferenceId { get; set; }
    }
}
