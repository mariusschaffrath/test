using Microsoft.EntityFrameworkCore;
using AutoscrollerAPI.Models;

namespace AutoscrollerAPI.Data
{
    public class ApplicationDbContext : DbContext
    {
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
            : base(options)
        {
        }

        public DbSet<HighscoreEntry> Highscores { get; set; }
    }
}
