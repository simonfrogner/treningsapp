import SwiftUI

struct SessionDetailView: View {
    @Environment(\.colorScheme) private var scheme
    let workout: Workout

    private var dateString: String {
        let fmt = DateFormatter()
        fmt.locale = Locale(identifier: "nb_NO")
        fmt.dateFormat = "EEEE d. MMMM"
        return fmt.string(from: workout.startedAt).capitalized
    }

    private var durationString: String {
        "\(Int(workout.duration / 60)) min"
    }

    private var orderedExercises: [WorkoutExercise] {
        workout.exercises.sorted { $0.order < $1.order }
    }

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: Theme.Spacing.sectionGap) {
                VStack(alignment: .leading, spacing: 4) {
                    Text(dateString)
                        .font(Theme.Typography.secondary)
                        .foregroundStyle(Theme.Palette.textSec(scheme))
                    Text("\(durationString)")
                        .font(Theme.Typography.secondary)
                        .foregroundStyle(Theme.Palette.textSec(scheme))
                }

                HStack(alignment: .firstTextBaseline, spacing: 8) {
                    Text("\(Int(workout.totalVolume))")
                        .font(Theme.Typography.bigNumber)
                        .foregroundStyle(Theme.Palette.text(scheme))
                    Text("kg totalt volum")
                        .font(.system(size: 15))
                        .foregroundStyle(Theme.Palette.textSec(scheme))
                }

                VStack(spacing: Theme.Spacing.cardGap) {
                    ForEach(orderedExercises) { ex in
                        Card {
                            VStack(alignment: .leading, spacing: 12) {
                                HStack(spacing: 8) {
                                    Text(ex.exerciseName)
                                        .font(Theme.Typography.cardTitle)
                                        .foregroundStyle(Theme.Palette.text(scheme))
                                    MuscleTag(muscle: ex.muscleGroup)
                                }
                                VStack(alignment: .leading, spacing: 4) {
                                    ForEach(ex.sets.sorted { $0.setNumber < $1.setNumber }) { set in
                                        HStack(spacing: 8) {
                                            Text("\(set.setNumber).")
                                                .font(Theme.Typography.secondary)
                                                .foregroundStyle(Theme.Palette.textTer(scheme))
                                                .frame(width: 22, alignment: .leading)
                                            Text("\(Int(set.weight)) kg × \(set.reps) reps")
                                                .font(Theme.Typography.secondary)
                                                .foregroundStyle(Theme.Palette.text(scheme))
                                                .monospacedDigit()
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
        .navigationTitle(workout.name)
        .navigationBarTitleDisplayMode(.inline)
        .toolbar(.hidden, for: .tabBar)
    }
}
