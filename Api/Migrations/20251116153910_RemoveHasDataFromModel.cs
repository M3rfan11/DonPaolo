using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace Api.Migrations
{
    /// <inheritdoc />
    public partial class RemoveHasDataFromModel : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // NOTE: This migration is intentionally empty.
            // We removed HasData() from the model builder, but we don't want to delete
            // any existing data from the database. The seed methods (SeedRoles, SeedUsers, etc.)
            // will ensure the data exists. This migration only updates the ModelSnapshot
            // to reflect that HasData is no longer in the model configuration.
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // NOTE: This migration is intentionally empty.
            // We don't want to restore HasData() in the model, as data seeding
            // is now handled by seed methods in Program.cs.
        }
    }
}
