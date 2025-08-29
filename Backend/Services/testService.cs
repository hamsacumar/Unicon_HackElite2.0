using MongoDB.Driver;
using Backend.Models;
using Backend.Settings;
using Microsoft.Extensions.Options;

//
namespace Backend.Services
{
    public interface ITestService
    {
        Task<List<TestItem>> GetAllAsync();
    }

    public class TestService : ITestService
    {
        private readonly IMongoCollection<TestItem> _testCollection;

        public TestService(IOptions<MongoDbSettings> settings, IMongoClient client)
        {
            var database = client.GetDatabase(settings.Value.DatabaseName);
            _testCollection = database.GetCollection<TestItem>("test");
        }

        public async Task<List<TestItem>> GetAllAsync() =>
            await _testCollection.Find(item => true).ToListAsync();
    }
}
