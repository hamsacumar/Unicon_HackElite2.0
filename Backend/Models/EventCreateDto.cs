using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;
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
    public string? ImageUrl { get; set; } // client passes the uploaded image URL
}

}