import SwiftUI
import SwiftData

struct ProfileView: View {
    @Environment(\.colorScheme) private var scheme
    @Query private var workouts: [Workout]

    private var thisMonthCount: Int {
        let cal = Calendar.current
        guard let monthStart = cal.dateInterval(of: .month, for: Date())?.start else { return 0 }
        return workouts.filter { !$0.isActive && $0.startedAt >= monthStart }.count
    }

    private var totalVolume: Int {
        Int(workouts.filter { !$0.isActive }.reduce(0) { $0 + $1.totalVolume })
    }

    private var streak: Int {
        let cal = Calendar.current
        let days = Set(workouts.filter { !$0.isActive }.map { cal.startOfDay(for: $0.startedAt) })
        var count = 0
        var day = cal.startOfDay(for: Date())
        while days.contains(day) {
            count += 1
            guard let prev = cal.date(byAdding: .day, value: -1, to: day) else { break }
            day = prev
        }
        return count
    }

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: Theme.Spacing.sectionGap) {
                Text("Profil")
                    .font(Theme.Typography.largeTitle)
                    .foregroundStyle(Theme.Palette.text(scheme))

                userHeader
                statsRow
                settingsList
            }
            .padding(.horizontal, Theme.Spacing.screenH)
            .padding(.top, 8)
            .padding(.bottom, 24)
        }
        .background(Theme.Palette.bg(scheme).ignoresSafeArea())
    }

    private var userHeader: some View {
        HStack(spacing: 16) {
            ZStack {
                Circle()
                    .fill(Theme.Palette.accentBg(scheme))
                Text("ME")
                    .font(.system(size: 28, weight: .bold))
                    .foregroundStyle(Theme.Palette.accent(scheme))
            }
            .frame(width: 80, height: 80)

            VStack(alignment: .leading, spacing: 4) {
                Text("Magnus Eriksen")
                    .font(.system(size: 20, weight: .semibold))
                    .foregroundStyle(Theme.Palette.text(scheme))
                Text("Trener siden mars 2024")
                    .font(Theme.Typography.secondary)
                    .foregroundStyle(Theme.Palette.textSec(scheme))
            }
            Spacer()
        }
    }

    private var statsRow: some View {
        HStack(spacing: 10) {
            StatCard(value: "\(thisMonthCount)", label: "treninger", sublabel: "denne mnd")
            StatCard(value: "\(totalVolume)", label: "kg", sublabel: "total volum")
            StatCard(value: "\(streak)", label: "dager", sublabel: "streak")
        }
    }

    private var settingsList: some View {
        Card(padding: 0) {
            VStack(spacing: 0) {
                SettingsRow(label: "Innstillinger", detail: nil)
                ListRowSeparator().padding(.leading, 16)
                SettingsRow(label: "Enheter", detail: "Metrisk (kg)")
                ListRowSeparator().padding(.leading, 16)
                SettingsRow(label: "Eksporter data", detail: nil)
                ListRowSeparator().padding(.leading, 16)
                SettingsRow(label: "Om appen", detail: nil)
            }
        }
    }
}

struct StatCard: View {
    @Environment(\.colorScheme) private var scheme
    let value: String
    let label: String
    let sublabel: String

    var body: some View {
        Card {
            VStack(alignment: .leading, spacing: 4) {
                Text(value)
                    .font(.system(size: 24, weight: .bold))
                    .foregroundStyle(Theme.Palette.text(scheme))
                    .monospacedDigit()
                Text(label)
                    .font(.system(size: 12))
                    .foregroundStyle(Theme.Palette.textSec(scheme))
                Text(sublabel)
                    .font(.system(size: 11))
                    .foregroundStyle(Theme.Palette.textTer(scheme))
            }
            .frame(maxWidth: .infinity, alignment: .leading)
        }
    }
}

struct SettingsRow: View {
    @Environment(\.colorScheme) private var scheme
    let label: String
    let detail: String?

    var body: some View {
        HStack(spacing: 12) {
            Text(label)
                .font(Theme.Typography.body)
                .foregroundStyle(Theme.Palette.text(scheme))
            Spacer()
            if let detail {
                Text(detail)
                    .font(Theme.Typography.secondary)
                    .foregroundStyle(Theme.Palette.textSec(scheme))
            }
            Chevron()
        }
        .padding(16)
    }
}
