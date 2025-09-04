// // Hubs/ChatHub.cs
// using Microsoft.AspNetCore.SignalR;
// using Backend.Models;
// using Backend.Data;
// using System.Threading.Tasks;

// namespace Backend.Hubs
// {
//     public class ChatHub : Hub
//     {
//         private readonly MongoDBService _db;
//         public ChatHub(MongoDBService db) { _db = db; }

//         public async Task SendMessage(Message msg)
//         {
//             // Save message to DB
//             await _db.Messages.InsertOneAsync(msg);

//             // Send message to receiver if connected
//             await Clients.User(msg.ReceiverId).SendAsync("ReceiveMessage", msg);

//             // Optionally, send back to sender for confirmation
//             await Clients.Caller.SendAsync("MessageSent", msg);
//         }

//         public override async Task OnConnectedAsync()
//         {
//             var userId = Context.GetHttpContext().Request.Query["userId"];
//             if (!string.IsNullOrEmpty(userId))
//                 await Groups.AddToGroupAsync(Context.ConnectionId, userId);
//             await base.OnConnectedAsync();
//         }
//     }
// }
