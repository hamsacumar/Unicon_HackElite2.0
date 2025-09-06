using Backend.Models;
using Backend.Settings;
using Microsoft.Extensions.Options;
using MongoDB.Driver;
using MongoDB.Bson;
using System.Collections.Generic;
using System.Threading.Tasks;


namespace Backend.Services
{
    public class FileUploadService
    {
        private readonly string _uploadFolder;

        public FileUploadService(IWebHostEnvironment env)
        {
            _uploadFolder = Path.Combine(env.WebRootPath ?? "wwwroot", "uploads");
            if (!Directory.Exists(_uploadFolder))
                Directory.CreateDirectory(_uploadFolder);
        }

        public async Task<string?> UploadImageAsync(IFormFile? file)
        {
            if (file == null || file.Length == 0) return null;

            var ext = Path.GetExtension(file.FileName);
            var fileName = $"img_{Guid.NewGuid()}{ext}";
            var savePath = Path.Combine(_uploadFolder, fileName);

            using (var stream = new FileStream(savePath, FileMode.Create))
            {
                await file.CopyToAsync(stream);
            }

            return $"/uploads/{fileName}";
        }
    }
}
