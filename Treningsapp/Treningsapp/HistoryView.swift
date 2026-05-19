import SwiftUI
import SwiftData

struct HistoryView: View {
    @Environment(\.colorScheme) private var scheme
    @Query(sort: \Workout.startedAt, order: .reverse) private var workouts: [Workout]

    private var grouped: [(label: String, items: [Workout])] {
        let completed = workouts.filter { !$0.isActive }
        let cal = Calendar.current
        let now = Date()
        guard let thisWeekStart = cal.dateInterval(of: .weekOfYear, for: now)?.start else {
            return [("Tidligere", completed)]
        }
        let lastWeekStart = cal.date(byAdding: .weekOfYear, value: -1, to: thisWeekStart) ?? thisWeekStart
        let twoWeeksAgoStart = cal.date(byAdding: .weekOfYear, value: -2, to: thisWeekStart) ?? thisWeekStart

        var thisWeek: [Workout] = []
        var lastWeek: [Workout] = []
        var twoAgo: [Workout] = []
        var older: [Workout] = []

        for w in completed {
            if w.startedAt >= thisWeekStart {
                thisWeek.append(w)
            } else if w.startedAt >= lastWeekStart {
                lastWeek.append(w)
            } else if w.startedAt >= twoWeeksAgoStart {
                twoAgo.append(w)
            } else {
                older.append(w)
            }
        }

        var groups: [(String, [Workout])] = []
        if !thisWeek.isEmpty { groups.append(("Denne uken", thisWeek)) }
        if !lastWeek.isEmpty { groups.append(("Forrige uke", lastWeek)) }
        if !twoAgo.isEmpty { groups.append(("For 2 uker siden", twoAgo)) }
        if !older.isEmpty { groups.append(("Tidligere", older)) }
        return groups
    }

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: Theme.Spacing.sectionGap) {
                    Text("Historikk")
                        .font(Theme.Typography.largeTitle)
                        .foregroundStyle(Theme.Palette.text(scheme))

                    if grouped.isEmpty {
                        Card {
                            Text("Ingen treninger ennå")
                                .font(Theme.Typography.secondary)
                                .foregroundStyle(Theme.Palette.textSec(scheme))
                                .frame(maxWidth: .infinity, alignment: .leading)
                        }
                    } else {
                        ForEach(grouped, id: \.label) { group in
                            VStack(alignment: .leading, spacing: 10) {
                                SectionHeader(title: group.label)
                                Card(padding: 0) {
                                    VStack(spacing: 0) {
                                        ForEach(Array(group.items.enumerated()), id: \.element.id) { idx, workout in
                                            NavigationLink(value: workout) {
                                                HistoryRow(workout: workout)
                                            }
                                            .buttonStyle(.plain)
                                            if idx < group.items.count - 1 {
                                                ListRowSeparator()
                                                    .padding(.leading, 16)
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
                .padding(.horizontal, Theme.Spacing.screenH)
                .padding(.top, 8)
                .padding(.bottom, 24)
            }
            .background(Theme.Palette.bg(scheme).ignoresSafeArea())
            .navigationDestination(for: Workout.self) { w in
                SessionDetailView(workout: w)
            }
        }
    }
}

struct HistoryRow: View {
    @Environment(\.colorScheme) private var scheme
    let workout: Workout

    private var dateString: String {
        let fmt = DateFormatter()
        fmt.locale = Locale(identifier: "nb_NO")
        fmt.dateFormat = "EEEE d. MMM"
        return fmt.string(from: workout.startedAt).capitalized
    }

    var body: some View {
        HStack(spacing: 12) {
            VStack(alignment: .leading, spacing: 4) {
                Text(workout.name)
                    .font(Theme.Typography.cardTitle)
                    .foregroundStyle(Theme.Palette.text(scheme))
                Text("\(dateString) · \(Int(workout.duration / 60)) min · \(Int(workout.totalVolume)) kg")
                    .font(Theme.Typography.secondary)
                    .foregroundStyle(Theme.Palette.textSec(scheme))
                    .monospacedDigit()
            }
            Spacer()
            Chevron()
        }
        .padding(16)
    }
}
