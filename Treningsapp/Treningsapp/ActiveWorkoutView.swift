import SwiftUI
import SwiftData
import Combine

struct ActiveWorkoutView: View {
    @Environment(\.colorScheme) private var scheme
    @Environment(\.modelContext) private var modelContext
    @Environment(\.dismiss) private var dismiss

    @Bindable var workout: Workout
    @Query(sort: \Exercise.name) private var library: [Exercise]

    @State private var now: Date = Date()
    private let timer = Timer.publish(every: 1, on: .main, in: .common).autoconnect()

    private var elapsedString: String {
        let total = Int(now.timeIntervalSince(workout.startedAt))
        return String(format: "%02d:%02d", total / 60, total % 60)
    }

    private var orderedExercises: [WorkoutExercise] {
        workout.exercises.sorted { $0.order < $1.order }
    }

    var body: some View {
        ScrollView {
            VStack(spacing: 24) {
                timerSection

                VStack(spacing: Theme.Spacing.cardGap) {
                    ForEach(orderedExercises) { ex in
                        ExerciseLogCard(exercise: ex)
                    }
                }

                addExerciseButton
                completeButton
            }
            .padding(.horizontal, Theme.Spacing.screenH)
            .padding(.top, 8)
            .padding(.bottom, 32)
        }
        .background(Theme.Palette.bg(scheme).ignoresSafeArea())
        .navigationTitle("Aktiv trening")
        .navigationBarTitleDisplayMode(.inline)
        .toolbar(.hidden, for: .tabBar)
        .onReceive(timer) { now = $0 }
    }

    private var timerSection: some View {
        VStack(spacing: 4) {
            Text(elapsedString)
                .font(Theme.Typography.timer)
                .tracking(-1)
                .foregroundStyle(Theme.Palette.text(scheme))
            Text("Varighet")
                .font(Theme.Typography.small)
                .foregroundStyle(Theme.Palette.textSec(scheme))
        }
        .frame(maxWidth: .infinity)
        .padding(.top, 16)
    }

    private var addExerciseButton: some View {
        Button {
            addNextExercise()
        } label: {
            HStack(spacing: 8) {
                Image(systemName: "plus")
                Text("Legg til øvelse")
            }
            .font(.system(size: 15, weight: .semibold))
            .foregroundStyle(Theme.Palette.accent(scheme))
            .frame(maxWidth: .infinity)
            .padding(.vertical, 14)
            .overlay(
                RoundedRectangle(cornerRadius: Theme.Radius.card, style: .continuous)
                    .strokeBorder(Theme.Palette.textTer(scheme), style: StrokeStyle(lineWidth: 1.5, dash: [6, 4]))
            )
        }
    }

    private var completeButton: some View {
        Button {
            workout.endedAt = Date()
            try? modelContext.save()
            dismiss()
        } label: {
            Text("Fullfør trening")
                .font(.system(size: 17, weight: .semibold))
                .foregroundStyle(.white)
                .frame(maxWidth: .infinity)
                .padding(.vertical, 16)
                .background(Theme.Palette.accent(scheme))
                .clipShape(RoundedRectangle(cornerRadius: Theme.Radius.card, style: .continuous))
        }
    }

    private func addNextExercise() {
        let usedNames = Set(workout.exercises.map(\.exerciseName))
        guard let next = library.first(where: { !usedNames.contains($0.name) }) else { return }
        let we = WorkoutExercise(
            exerciseName: next.name,
            muscleGroup: next.muscleGroup,
            order: workout.exercises.count
        )
        we.workout = workout
        modelContext.insert(we)
        let set = WorkoutSet(setNumber: 1)
        set.workoutExercise = we
        modelContext.insert(set)
    }
}

struct ExerciseLogCard: View {
    @Environment(\.colorScheme) private var scheme
    @Environment(\.modelContext) private var modelContext
    @Bindable var exercise: WorkoutExercise

    private var orderedSets: [WorkoutSet] {
        exercise.sets.sorted { $0.setNumber < $1.setNumber }
    }

    var body: some View {
        Card {
            VStack(alignment: .leading, spacing: 14) {
                HStack(spacing: 8) {
                    Text(exercise.exerciseName)
                        .font(Theme.Typography.cardTitle)
                        .foregroundStyle(Theme.Palette.text(scheme))
                    MuscleTag(muscle: exercise.muscleGroup)
                    Spacer()
                }

                HStack(spacing: 0) {
                    Text("SETT").frame(width: 36, alignment: .leading)
                    Text("KG").frame(maxWidth: .infinity, alignment: .leading)
                    Text("REPS").frame(maxWidth: .infinity, alignment: .leading)
                    Spacer().frame(width: 40)
                }
                .font(.system(size: 11, weight: .semibold))
                .tracking(0.4)
                .foregroundStyle(Theme.Palette.textTer(scheme))

                VStack(spacing: 6) {
                    ForEach(orderedSets) { set in
                        SetRow(set: set)
                    }
                }

                Button {
                    addSet()
                } label: {
                    HStack(spacing: 6) {
                        Image(systemName: "plus")
                        Text("Legg til sett")
                    }
                    .font(.system(size: 14, weight: .semibold))
                    .foregroundStyle(Theme.Palette.accent(scheme))
                }
            }
        }
    }

    private func addSet() {
        let nextNumber = (orderedSets.last?.setNumber ?? 0) + 1
        let last = orderedSets.last
        let s = WorkoutSet(
            setNumber: nextNumber,
            weight: last?.weight ?? 0,
            reps: last?.reps ?? 0
        )
        s.workoutExercise = exercise
        modelContext.insert(s)
    }
}

struct SetRow: View {
    @Environment(\.colorScheme) private var scheme
    @Bindable var set: WorkoutSet

    var body: some View {
        HStack(spacing: 0) {
            Text("\(set.setNumber)")
                .font(.system(size: 14, weight: .semibold))
                .foregroundStyle(Theme.Palette.textSec(scheme))
                .frame(width: 36, alignment: .leading)

            TextField("0", value: $set.weight, format: .number)
                .keyboardType(.decimalPad)
                .font(.system(size: 17, weight: .semibold))
                .foregroundStyle(Theme.Palette.text(scheme))
                .frame(maxWidth: .infinity, alignment: .leading)

            TextField("0", value: $set.reps, format: .number)
                .keyboardType(.numberPad)
                .font(.system(size: 17, weight: .semibold))
                .foregroundStyle(Theme.Palette.text(scheme))
                .frame(maxWidth: .infinity, alignment: .leading)

            Button {
                withAnimation(.easeInOut(duration: 0.15)) {
                    set.isCompleted.toggle()
                }
            } label: {
                ZStack {
                    Circle()
                        .strokeBorder(Theme.Palette.textTer(scheme), lineWidth: 2)
                        .frame(width: 28, height: 28)
                    if set.isCompleted {
                        Circle()
                            .fill(Theme.Palette.accent(scheme))
                            .frame(width: 28, height: 28)
                        Image(systemName: "checkmark")
                            .font(.system(size: 13, weight: .bold))
                            .foregroundStyle(.white)
                    }
                }
            }
            .buttonStyle(.plain)
            .frame(width: 40, alignment: .trailing)
        }
        .padding(.vertical, 6)
        .padding(.horizontal, 8)
        .background(
            RoundedRectangle(cornerRadius: 8, style: .continuous)
                .fill(set.isCompleted ? Theme.Palette.accent(scheme).opacity(0.04) : .clear)
        )
    }
}
