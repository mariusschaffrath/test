using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using AutoscrollerAPI.Data;
using AutoscrollerAPI.Models;

namespace AutoscrollerAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class HighscoresController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public HighscoresController(ApplicationDbContext context)
        {
            _context = context;
        }

        // GET api/highscores
        [HttpGet]
        public async Task<ActionResult<IEnumerable<HighscoreEntry>>> GetHighscores()
        {
            var result = await _context.Highscores
                .OrderByDescending(h => h.Score)
                .Take(20)
                .ToListAsync();

            return Ok(result);
        }

        // POST api/highscores
        [HttpPost]
        public async Task<ActionResult<HighscoreEntry>> PostHighscore(HighscoreEntry entry)
        {
            entry.CreatedAt = DateTime.UtcNow;

            _context.Highscores.Add(entry);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetHighscores), new { id = entry.Id }, entry);
        }

        // DELETE api/highscores/{id}
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteHighscore(int id)
        {
            var entry = await _context.Highscores.FindAsync(id);
            if (entry == null)
                return NotFound();

            _context.Highscores.Remove(entry);
            await _context.SaveChangesAsync();
            return NoContent();
        }
    }
}
