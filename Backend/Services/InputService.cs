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
            var db = client.GetDatabase(settings.Value.DatabaseName);
            _events = db.GetCollection<EventModel>("events");
        }

        public async Task<List<EventModel>> GetAsync() =>
            await _events.Find(e => true).SortByDescending(e => e.CreatedAt).ToListAsync();

        public async Task<EventModel> CreateAsync(EventModel ev)
        {
            await _events.InsertOneAsync(ev);
            return ev;
        }
    }
}
