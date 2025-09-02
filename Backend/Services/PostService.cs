using Backend.Models;
using Backend.Settings;
using Microsoft.Extensions.Options;
using MongoDB.Driver;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace Backend.Services
{
    public class PostService : IPostService  // Implement the interface
    {
        private readonly IMongoCollection<EventModel> _events;

        public PostService(IMongoClient mongoClient, IOptions<MongoDbSettings> settings)
        {
            var database = mongoClient.GetDatabase(settings.Value.DatabaseName);
            _events = database.GetCollection<EventModel>("events");
        }

        public async Task<List<EventModel>> GetAsync() =>
            await _events.Find(_ => true).ToListAsync();

        public async Task<EventModel?> GetByIdAsync(string id) =>
            await _events.Find(ev => ev.Id == id).FirstOrDefaultAsync();

        public async Task CreateAsync(EventModel ev) =>
            await _events.InsertOneAsync(ev);
    }
}