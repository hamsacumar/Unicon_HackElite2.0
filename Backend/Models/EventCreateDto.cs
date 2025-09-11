using Microsoft.AspNetCore.Http;
using System;

namespace Backend.Models
{
    public class EventCreateDto
    {
        public string Title { get; set; } = null!;
        public string Description { get; set; } = null!;
        public string Category { get; set; } = null!;
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
        public IFormFile? Image { get; set; }
        public string? UserId { get; set; } // optional
    }
}
