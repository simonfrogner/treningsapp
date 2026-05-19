import SwiftUI
import SwiftData

struct ExercisesView: View {
    @Environment(\.colorScheme) private var scheme
    @Query(sort: \Exercise.name) private var exercises: [Exercise]

    @State private var search: String = ""
    @State private var filter: MuscleGroup? = nil

    private var filtered: [Exercise] {
        exercises.filter { ex in
            let matchSearch = search.isEmpty || ex.name.localizedCaseInsensitiveContains(search)
            let matchFilter = filter == nil || ex.muscleGroup == filter
            return matchSearch && matchFilter
        }
    }

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 20) {
                Text("Øvelser")
                    .font(Theme.Typography.largeTitle)
                    .foregroundStyle(Theme.Palette.text(scheme))

                searchField
                filterChips

                if filtered.isEmpty {
                    Card {
                        Text(exercises.isEmpty ? "Ingen øvelser ennå" : "Ingen treff")
                            .font(Theme.Typography.secondary)
                            .foregroundStyle(Theme.Palette.textSec(scheme))
                            .frame(maxWidth: .infinity, alignment: .leading)
                    }
                } else {
                    Card(padding: 0) {
                        VStack(spacing: 0) {
                            ForEach(Array(filtered.enumerated()), id: \.element.id) { idx, ex in
                                ExerciseRow(exercise: ex)
                                if idx < filtered.count - 1 {
                                    ListRowSeparator().padding(.leading, 16)
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
    }

    private var searchField: some View {
        HStack(spacing: 8) {
            Image(systemName: "magnifyingglass")
                .foregroundStyle(Theme.Palette.textTer(scheme))
            TextField("Søk øvelser...", text: $search)
                .font(Theme.Typography.body)
                .foregroundStyle(Theme.Palette.text(scheme))
        }
        .padding(.horizontal, 14)
        .padding(.vertical, 10)
        .background(Theme.Palette.surface(scheme))
        .clipShape(RoundedRectangle(cornerRadius: Theme.Radius.search, style: .continuous))
    }

    private var filterChips: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: 8) {
                FilterChip(label: "Alle", isActive: filter == nil) {
                    filter = nil
                }
                ForEach(MuscleGroup.allCases) { g in
                    FilterChip(label: g.rawValue, isActive: filter == g) {
                        filter = g
                    }
                }
            }
        }
    }
}

struct FilterChip: View {
    @Environment(\.colorScheme) private var scheme
    let label: String
    let isActive: Bool
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            Text(label)
                .font(.system(size: 14, weight: .medium))
                .foregroundStyle(isActive ? .white : Theme.Palette.textSec(scheme))
                .padding(.horizontal, 14)
                .padding(.vertical, 7)
                .background(isActive ? Theme.Palette.accent(scheme) : Theme.Palette.surface(scheme))
                .clipShape(RoundedRectangle(cornerRadius: Theme.Radius.chip, style: .continuous))
        }
    }
}

struct ExerciseRow: View {
    @Environment(\.colorScheme) private var scheme
    let exercise: Exercise

    private var prString: String? {
        guard let w = exercise.prWeight, let r = exercise.prReps else { return nil }
        return "PR: \(Int(w)) × \(r)"
    }

    var body: some View {
        HStack(spacing: 12) {
            VStack(alignment: .leading, spacing: 4) {
                Text(exercise.name)
                    .font(.system(size: 16, weight: .medium))
                    .foregroundStyle(Theme.Palette.text(scheme))
                HStack(spacing: 8) {
                    MuscleTag(muscle: exercise.muscleGroup)
                    if let pr = prString {
                        Text(pr)
                            .font(Theme.Typography.small)
                            .foregroundStyle(Theme.Palette.textSec(scheme))
                            .monospacedDigit()
                    }
                }
            }
            Spacer()
            Chevron()
        }
        .padding(16)
    }
}
