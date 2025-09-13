namespace Backend.Settings
{
    public class MongoDbSettings
    {
        public string ConnectionString { get; set; } = null!;
        public string DatabaseName { get; set; } = null!;
        public string? EventsCollectionName { get; internal set; }
    }
}
