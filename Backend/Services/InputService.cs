using Backend.Models;
using Backend.Settings;
using Microsoft.Extensions.Options;
using MongoDB.Driver;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace Backend.Services
{
    public class InputService
    {
        private readonly IMongoCollection<EventModel> _events;

        public InputService(IOptions<MongoDbSettings> settings, IMongoClient client)
        {
            // Use injected client for better DI & testability
            var db = client.GetDatabase(settings.Value.DatabaseName);
            _events = db.GetCollection<EventModel>("events"); // or settings.Value.EventsCollectionName
        }

        // GET all events (async)
        public async Task<List<EventModel>> GetAsync() =>
            await _events.Find(e => true).SortByDescending(e => e.CreatedAt).ToListAsync();

        // CREATE new event (async)
        public async Task<EventModel> CreateAsync(EventModel ev)
        {
            await _events.InsertOneAsync(ev);
            return ev;
        }

        // GET events by user
    public async Task<List<EventModel>> GetByUserAsync(string userId) =>
        await _events.Find(e => e.UserId == userId).SortByDescending(e => e.CreatedAt).ToListAsync();

    }
}
