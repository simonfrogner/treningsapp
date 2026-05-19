import SwiftUI
import SwiftData

enum Tab: Hashable {
    case home, history, exercises, profile
}

struct RootView: View {
    @Environment(\.colorScheme) private var scheme
    @State private var selectedTab: Tab = .home

    var body: some View {
        TabView(selection: $selectedTab) {
            HomeView()
                .tabItem {
                    Label("Hjem", systemImage: "house")
                }
                .tag(Tab.home)

            HistoryView()
                .tabItem {
                    Label("Historikk", systemImage: "clock")
                }
                .tag(Tab.history)

            ExercisesView()
                .tabItem {
                    Label("Øvelser", systemImage: "dumbbell")
                }
                .tag(Tab.exercises)

            ProfileView()
                .tabItem {
                    Label("Profil", systemImage: "person")
                }
                .tag(Tab.profile)
        }
        .tint(Theme.Palette.accent(scheme))
    }
}

#Preview {
    RootView()
        .modelContainer(for: [Workout.self, Exercise.self, WorkoutExercise.self, WorkoutSet.self], inMemory: true)
}
