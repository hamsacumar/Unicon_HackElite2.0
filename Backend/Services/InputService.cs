using Backend.Models;
using Backend.Settings;
using Microsoft.Extensions.Options;
using MongoDB.Driver;
using System.Collections.Generic;
using System;

namespace EventApi.Services
{
    public class MongoService
    {
        private readonly IMongoCollection<EventModel> _events;

        public MongoService(IOptions<MongoSettings> settings)
        {
            var client = new MongoClient(settings.Value.ConnectionString);
            var db = client.GetDatabase(settings.Value.DatabaseName);
            _events = db.GetCollection<EventModel>(settings.Value.EventsCollectionName);
        }

        public List<EventModel> Get() => _events.Find(e => true).SortByDescending(e => e.CreatedAt).ToList();

        public EventModel Create(EventModel ev)
        {
            _events.InsertOne(ev);
            return ev;
        }
    }
}
