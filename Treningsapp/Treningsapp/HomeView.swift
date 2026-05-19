import SwiftUI
import SwiftData

struct HomeView: View {
    @Environment(\.colorScheme) private var scheme
    @Environment(\.modelContext) private var modelContext
    @Query(sort: \Workout.startedAt, order: .reverse) private var workouts: [Workout]
    @Query(sort: \Exercise.name) private var library: [Exercise]

    @State private var activeWorkout: Workout? = nil

    private var greeting: String {
        let hour = Calendar.current.component(.hour, from: Date())
        switch hour {
        case 5..<10: return "God morgen,"
        case 10..<17: return "God ettermiddag,"
        case 17..<23: return "God kveld,"
        default: return "God natt,"
        }
    }

    private var recentWorkouts: [Workout] {
        Array(workouts.filter { !$0.isActive }.prefix(3))
    }

    private var weeklyWorkouts: [Workout] {
        let cal = Calendar.current
        guard let weekStart = cal.dateInterval(of: .weekOfYear, for: Date())?.start else { return [] }
        return workouts.filter { !$0.isActive && $0.startedAt >= weekStart }
    }

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: Theme.Spacing.sectionGap) {
                    VStack(alignment: .leading, spacing: 4) {
                        Text(greeting)
                            .font(.system(size: 15))
                            .foregroundStyle(Theme.Palette.textSec(scheme))
                        Text("Magnus")
                            .font(Theme.Typography.largeTitle)
                            .foregroundStyle(Theme.Palette.text(scheme))
                    }

                    startWorkoutButton

                    VStack(alignment: .leading, spacing: 12) {
                        SectionHeader(title: "Siste treninger")
                        if recentWorkouts.isEmpty {
                            Card {
                                Text("Ingen treninger ennå")
                                    .font(Theme.Typography.secondary)
                                    .foregroundStyle(Theme.Palette.textSec(scheme))
                                    .frame(maxWidth: .infinity, alignment: .leading)
                            }
                        } else {
                            VStack(spacing: Theme.Spacing.cardGap) {
                                ForEach(recentWorkouts) { workout in
                                    NavigationLink(value: workout) {
                                        WorkoutCard(workout: workout)
                                    }
                                    .buttonStyle(.plain)
                                }
                            }
                        }
                    }

                    weekSummary
                }
                .padding(.horizontal, Theme.Spacing.screenH)
                .padding(.top, 8)
                .padding(.bottom, 24)
            }
            .background(Theme.Palette.bg(scheme).ignoresSafeArea())
            .navigationDestination(for: Workout.self) { w in
                SessionDetailView(workout: w)
            }
            .fullScreenCover(item: $activeWorkout) { w in
                NavigationStack {
                    ActiveWorkoutView(workout: w)
                }
            }
        }
    }

    private var startWorkoutButton: some View {
        Button {
            startNewWorkout()
        } label: {
            HStack {
                VStack(alignment: .leading, spacing: 2) {
                    Text("Start trening")
                        .font(.system(size: 17, weight: .semibold))
                        .foregroundStyle(.white)
                    Text("Logg øvelser og sett")
                        .font(.system(size: 13))
                        .foregroundStyle(.white.opacity(0.7))
                }
                Spacer()
                Image(systemName: "arrow.right")
                    .font(.system(size: 17, weight: .semibold))
                    .foregroundStyle(.white)
            }
            .padding(.horizontal, 18)
            .frame(height: 56)
            .background(Theme.Palette.accent(scheme))
            .clipShape(RoundedRectangle(cornerRadius: 16, style: .continuous))
        }
    }

    private var weekSummary: some View {
        Card {
            HStack(spacing: 24) {
                VStack(alignment: .leading, spacing: 2) {
                    Text("\(weeklyWorkouts.count)")
                        .font(Theme.Typography.bigNumber)
                        .foregroundStyle(Theme.Palette.text(scheme))
                    Text("treninger denne uken")
                        .font(Theme.Typography.small)
                        .foregroundStyle(Theme.Palette.textSec(scheme))
                }
                Spacer()
                VStack(alignment: .leading, spacing: 2) {
                    Text("\(Int(weeklyWorkouts.reduce(0) { $0 + $1.totalVolume })) kg")
                        .font(Theme.Typography.bigNumber)
                        .foregroundStyle(Theme.Palette.text(scheme))
                    Text("total volum")
                        .font(Theme.Typography.small)
                        .foregroundStyle(Theme.Palette.textSec(scheme))
                }
            }
        }
    }

    private func startNewWorkout() {
        let workout = Workout(name: "Ny trening")
        modelContext.insert(workout)

        if let first = library.first {
            let we = WorkoutExercise(exerciseName: first.name, muscleGroup: first.muscleGroup, order: 0)
            we.workout = workout
            modelContext.insert(we)
            let s = WorkoutSet(setNumber: 1)
            s.workoutExercise = we
            modelContext.insert(s)
        }

        activeWorkout = workout
    }
}

struct WorkoutCard: View {
    @Environment(\.colorScheme) private var scheme
    let workout: Workout

    private var dateString: String {
        let fmt = DateFormatter()
        fmt.locale = Locale(identifier: "nb_NO")
        fmt.dateFormat = "d. MMM"
        return fmt.string(from: workout.startedAt)
    }

    private var durationString: String {
        let mins = Int(workout.duration / 60)
        return "\(mins) min"
    }

    private var exerciseNames: String {
        workout.exercises
            .sorted { $0.order < $1.order }
            .map(\.exerciseName)
            .joined(separator: ", ")
    }

    var body: some View {
        Card {
            HStack(alignment: .center, spacing: 12) {
                VStack(alignment: .leading, spacing: 4) {
                    Text(workout.name)
                        .font(Theme.Typography.cardTitle)
                        .foregroundStyle(Theme.Palette.text(scheme))
                    Text("\(dateString) · \(durationString) · \(Int(workout.totalVolume)) kg")
                        .font(Theme.Typography.secondary)
                        .foregroundStyle(Theme.Palette.textSec(scheme))
                    if !exerciseNames.isEmpty {
                        Text(exerciseNames)
                            .font(Theme.Typography.small)
                            .foregroundStyle(Theme.Palette.textTer(scheme))
                            .lineLimit(1)
                    }
                }
                Spacer()
                Chevron()
            }
        }
    }
}
