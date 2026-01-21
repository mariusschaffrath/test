using Microsoft.AspNetCore.Mvc;

namespace Backend.Controllers;

[ApiController]
[Route("api/[controller]")]
public class GameController : ControllerBase
{
    [HttpGet]
    public ActionResult<IEnumerable<string>> Get()
    {
        return Ok(new[] { "Game 1", "Game 2", "Game 3" });
    }

    [HttpGet("{id}")]
    public ActionResult<string> Get(int id)
    {
        if (id <= 0)
        {
            return BadRequest("Invalid game ID");
        }
        
        return Ok($"Game {id}");
    }

    [HttpPost]
    public ActionResult<string> Post([FromBody] string gameName)
    {
        if (string.IsNullOrWhiteSpace(gameName))
        {
            return BadRequest("Game name cannot be empty");
        }
        
        return Ok($"Created game: {gameName}");
    }
}