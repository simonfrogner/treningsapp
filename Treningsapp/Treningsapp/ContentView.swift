import SwiftUI
import SwiftData

struct ContentView: View {
    @Query private var workouts: [Workout]
    @Query private var exercises: [Exercise]

    var body: some View {
        VStack(spacing: 8) {
            Text("Treningsapp")
                .font(Theme.Typography.largeTitle)
            Text("\(workouts.count) treninger · \(exercises.count) øvelser")
                .font(Theme.Typography.secondary)
                .foregroundStyle(.secondary)
        }
        .padding()
    }
}

#Preview {
    ContentView()
        .modelContainer(for: [Workout.self, Exercise.self, WorkoutExercise.self, WorkoutSet.self], inMemory: true)
}
