import Foundation
import SwiftData

enum SampleData {
    static func seedIfNeeded(_ context: ModelContext) {
        let descriptor = FetchDescriptor<Exercise>()
        let count = (try? context.fetchCount(descriptor)) ?? 0
        guard count == 0 else { return }

        let library: [(String, MuscleGroup, Double?, Int?)] = [
            ("Benkpress", .bryst, 100, 5),
            ("Skråbenk hantel", .bryst, 32, 8),
            ("Flies", .bryst, nil, nil),
            ("Markløft", .rygg, 160, 3),
            ("Nedtrekk", .rygg, 70, 8),
            ("Stang-rodning", .rygg, 80, 6),
            ("Knebøy", .ben, 140, 5),
            ("Beinpress", .ben, 200, 8),
            ("Leg curl", .ben, 50, 10),
            ("Skulderpress", .skuldre, 50, 6),
            ("Lateral raises", .skuldre, 12, 12),
            ("Bicepscurl", .armer, 18, 10),
            ("Tricepspress", .armer, 30, 8),
            ("Plank", .mage, nil, nil),
            ("Hengende kneløft", .mage, nil, nil),
        ]

        for (name, muscle, pr, reps) in library {
            context.insert(Exercise(name: name, muscleGroup: muscle, prWeight: pr, prReps: reps))
        }

        let now = Date()
        let cal = Calendar.current

        let pastWorkouts: [(String, Int, [(String, MuscleGroup, [(Double, Int)])])] = [
            ("Push", -1, [
                ("Benkpress", .bryst, [(80, 8), (80, 8), (80, 7)]),
                ("Skulderpress", .skuldre, [(45, 8), (45, 7)]),
                ("Tricepspress", .armer, [(25, 10), (25, 10)])
            ]),
            ("Pull", -3, [
                ("Markløft", .rygg, [(120, 5), (130, 5), (140, 3)]),
                ("Nedtrekk", .rygg, [(60, 10), (60, 8)]),
                ("Bicepscurl", .armer, [(16, 10), (16, 10)])
            ]),
            ("Ben", -5, [
                ("Knebøy", .ben, [(100, 8), (110, 6), (120, 5)]),
                ("Beinpress", .ben, [(180, 10), (180, 10)])
            ]),
            ("Push", -8, [
                ("Benkpress", .bryst, [(75, 8), (80, 6)]),
                ("Lateral raises", .skuldre, [(10, 12), (10, 12)])
            ]),
        ]

        for (name, daysAgo, exercises) in pastWorkouts {
            let start = cal.date(byAdding: .day, value: daysAgo, to: now) ?? now
            let end = cal.date(byAdding: .minute, value: 55, to: start) ?? start
            let workout = Workout(name: name, startedAt: start)
            workout.endedAt = end
            context.insert(workout)

            for (idx, ex) in exercises.enumerated() {
                let we = WorkoutExercise(exerciseName: ex.0, muscleGroup: ex.1, order: idx)
                we.workout = workout
                context.insert(we)
                for (i, set) in ex.2.enumerated() {
                    let s = WorkoutSet(setNumber: i + 1, weight: set.0, reps: set.1, isCompleted: true)
                    s.workoutExercise = we
                    context.insert(s)
                }
            }
        }

        try? context.save()
    }
}
