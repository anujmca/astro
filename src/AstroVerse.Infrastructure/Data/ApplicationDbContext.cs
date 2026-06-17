using Microsoft.EntityFrameworkCore;
using AstroVerse.Core.Domain;

namespace AstroVerse.Infrastructure.Data
{
    public class ApplicationDbContext : DbContext
    {
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
            : base(options)
        {
        }

        public DbSet<User> Users => Set<User>();
        public DbSet<Astrologer> Astrologers => Set<Astrologer>();
        public DbSet<Subscription> Subscriptions => Set<Subscription>();
        public DbSet<FamilyMember> FamilyMembers => Set<FamilyMember>();
        public DbSet<Kundli> Kundlis => Set<Kundli>();
        public DbSet<CompatibilityReport> CompatibilityReports => Set<CompatibilityReport>();
        public DbSet<Horoscope> Horoscopes => Set<Horoscope>();
        public DbSet<Appointment> Appointments => Set<Appointment>();
        public DbSet<Payment> Payments => Set<Payment>();
        public DbSet<Translation> Translations => Set<Translation>();
        public DbSet<AuditLog> AuditLogs => Set<AuditLog>();

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // User configuration
            modelBuilder.Entity<User>(entity =>
            {
                entity.ToTable("Users");
                entity.HasKey(e => e.Id);
                entity.HasIndex(e => e.Email).IsUnique();
            });

            // Astrologer configuration
            modelBuilder.Entity<Astrologer>(entity =>
            {
                entity.ToTable("Astrologers");
                entity.HasKey(e => e.Id);
                
                entity.HasOne(e => e.User)
                    .WithOne(u => u.AstrologerProfile)
                    .HasForeignKey<Astrologer>(e => e.UserId)
                    .OnDelete(DeleteBehavior.Cascade);
            });

            // FamilyMember configuration
            modelBuilder.Entity<FamilyMember>(entity =>
            {
                entity.ToTable("FamilyMembers");
                entity.HasKey(e => e.Id);

                entity.HasOne(e => e.User)
                    .WithMany()
                    .HasForeignKey(e => e.UserId)
                    .OnDelete(DeleteBehavior.Cascade);
            });

            // Kundli configuration
            modelBuilder.Entity<Kundli>(entity =>
            {
                entity.ToTable("Kundlis");
                entity.HasKey(e => e.Id);

                entity.HasOne(e => e.FamilyMember)
                    .WithMany(f => f.Kundlis)
                    .HasForeignKey(e => e.FamilyMemberId)
                    .OnDelete(DeleteBehavior.Cascade);
            });

            // CompatibilityReport configuration
            modelBuilder.Entity<CompatibilityReport>(entity =>
            {
                entity.ToTable("CompatibilityReports");
                entity.HasKey(e => e.Id);

                entity.HasOne(e => e.PrimaryMember)
                    .WithMany()
                    .HasForeignKey(e => e.PrimaryMemberId)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.HasOne(e => e.SecondaryMember)
                    .WithMany()
                    .HasForeignKey(e => e.SecondaryMemberId)
                    .OnDelete(DeleteBehavior.Cascade);
            });

            // Subscriptions
            modelBuilder.Entity<Subscription>(entity =>
            {
                entity.ToTable("Subscriptions");
                entity.HasKey(e => e.Id);

                entity.HasOne(e => e.User)
                    .WithMany()
                    .HasForeignKey(e => e.UserId)
                    .OnDelete(DeleteBehavior.Cascade);
            });

            // Appointments
            modelBuilder.Entity<Appointment>(entity =>
            {
                entity.ToTable("Appointments");
                entity.HasKey(e => e.Id);

                entity.HasOne(e => e.User)
                    .WithMany()
                    .HasForeignKey(e => e.UserId)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.HasOne(e => e.Astrologer)
                    .WithMany()
                    .HasForeignKey(e => e.AstrologerId)
                    .OnDelete(DeleteBehavior.Cascade);
            });

            // Payments
            modelBuilder.Entity<Payment>(entity =>
            {
                entity.ToTable("Payments");
                entity.HasKey(e => e.Id);

                entity.HasOne(e => e.User)
                    .WithMany()
                    .HasForeignKey(e => e.UserId)
                    .OnDelete(DeleteBehavior.Cascade);
            });

            // Translations
            modelBuilder.Entity<Translation>(entity =>
            {
                entity.ToTable("Translations");
                entity.HasKey(e => e.Id);
                entity.HasIndex(e => new { e.LanguageCode, e.Key }).IsUnique();
            });

            // AuditLogs
            modelBuilder.Entity<AuditLog>(entity =>
            {
                entity.ToTable("AuditLogs");
                entity.HasKey(e => e.Id);
            });
        }
    }
}
