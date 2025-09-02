using Backend.Models;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace Backend.Services
{
    public interface IPostService
    {
        Task<List<EventModel>> GetAsync();
        Task<EventModel?> GetByIdAsync(string id);
        Task CreateAsync(EventModel ev);

        // Mandatory: fetch events with user info
        Task<List<EventDto>> GetEventsWithUsersAsync();
    }
}
