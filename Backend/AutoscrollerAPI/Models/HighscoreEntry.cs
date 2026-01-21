using System;
using System.ComponentModel.DataAnnotations;

namespace AutoscrollerAPI.Models
{
    public class HighscoreEntry
    {
        public int Id { get; set; }

        [Required]
        [MaxLength(3)]
        public string PlayerName { get; set; } = string.Empty;

        [Range(0, int.MaxValue)]
        public int Score { get; set; }

        public DateTime CreatedAt { get; set; }
    }
}
