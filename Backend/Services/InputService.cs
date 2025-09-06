using Backend.Models;
using Backend.Settings;
using Microsoft.Extensions.Options;
using MongoDB.Driver;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace Backend.Services
{
    public class InputService : IInputService
    {
        private readonly IMongoCollection<EventModel> _events;

        public InputService(IOptions<MongoDbSettings> settings, IMongoClient client)
        {
            var db = client.GetDatabase(settings.Value.DatabaseName);
            _events = db.GetCollection<EventModel>(
                settings.Value.EventsCollectionName ?? "Events"
            );
        }

        /// <summary>
        /// Get all events sorted by CreatedAt (newest first).
        /// </summary>
        public async Task<List<EventModel>> GetAllAsync() =>
            await _events.Find(_ => true)
                         .SortByDescending(e => e.CreatedAt)
                         .ToListAsync();

        /// <summary>
        /// Create a new event and return it.
        /// </summary>
        public async Task<EventModel> CreateAsync(EventModel ev)
        {
            await _events.InsertOneAsync(ev);
            return ev;
        }

        /// <summary>
        /// Get events created by a specific user.
        /// </summary>
        public async Task<List<EventModel>> GetByUserAsync(string userId) =>
            await _events.Find(e => e.UserId == userId)
                         .SortByDescending(e => e.CreatedAt)
                         .ToListAsync();

        /// <summary>
        /// Get a single event by its Id.
        /// </summary>
        public async Task<EventModel?> GetByIdAsync(string id) =>
            await _events.Find(e => e.Id == id).FirstOrDefaultAsync();

        /// <summary>
        /// Update an event by Id.
        /// </summary>
        public async Task<bool> UpdateAsync(string id, EventModel updatedEvent)
        {
            var result = await _events.ReplaceOneAsync(e => e.Id == id, updatedEvent);
            return result.ModifiedCount > 0;
        }

        /// <summary>
        /// Delete an event by Id.
        /// </summary>
        public async Task<bool> DeleteAsync(string id)
        {
            var result = await _events.DeleteOneAsync(e => e.Id == id);
            return result.DeletedCount > 0;
        }

        internal Task GetAsync()
        {
            throw new NotImplementedException();
        }
    }

    public interface IInputService
    {
        Task<List<EventModel>> GetAllAsync();
        Task<EventModel> CreateAsync(EventModel ev);
        Task<List<EventModel>> GetByUserAsync(string userId);
        Task<EventModel?> GetByIdAsync(string id);
        Task<bool> UpdateAsync(string id, EventModel updatedEvent);
        Task<bool> DeleteAsync(string id);
    }
}
