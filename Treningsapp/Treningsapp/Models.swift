import Foundation
import SwiftData

enum MuscleGroup: String, Codable, CaseIterable, Identifiable {
    case bryst = "Bryst"
    case rygg = "Rygg"
    case ben = "Ben"
    case skuldre = "Skuldre"
    case armer = "Armer"
    case mage = "Mage"

    var id: String { rawValue }
}

@Model
final class Exercise {
    var name: String
    var muscleGroupRaw: String
    var prWeight: Double?
    var prReps: Int?
    var createdAt: Date

    var muscleGroup: MuscleGroup {
        get { MuscleGroup(rawValue: muscleGroupRaw) ?? .bryst }
        set { muscleGroupRaw = newValue.rawValue }
    }

    init(name: String, muscleGroup: MuscleGroup, prWeight: Double? = nil, prReps: Int? = nil) {
        self.name = name
        self.muscleGroupRaw = muscleGroup.rawValue
        self.prWeight = prWeight
        self.prReps = prReps
        self.createdAt = Date()
    }
}

@Model
final class Workout {
    var name: String
    var startedAt: Date
    var endedAt: Date?
    @Relationship(deleteRule: .cascade, inverse: \WorkoutExercise.workout)
    var exercises: [WorkoutExercise] = []

    var duration: TimeInterval {
        guard let endedAt else { return Date().timeIntervalSince(startedAt) }
        return endedAt.timeIntervalSince(startedAt)
    }

    var totalVolume: Double {
        exercises.reduce(0) { $0 + $1.totalVolume }
    }

    var isActive: Bool { endedAt == nil }

    init(name: String, startedAt: Date = Date()) {
        self.name = name
        self.startedAt = startedAt
    }
}

@Model
final class WorkoutExercise {
    var exerciseName: String
    var muscleGroupRaw: String
    var order: Int
    var workout: Workout?
    @Relationship(deleteRule: .cascade, inverse: \WorkoutSet.workoutExercise)
    var sets: [WorkoutSet] = []

    var muscleGroup: MuscleGroup {
        MuscleGroup(rawValue: muscleGroupRaw) ?? .bryst
    }

    var totalVolume: Double {
        sets.filter(\.isCompleted).reduce(0) { $0 + $1.weight * Double($1.reps) }
    }

    init(exerciseName: String, muscleGroup: MuscleGroup, order: Int) {
        self.exerciseName = exerciseName
        self.muscleGroupRaw = muscleGroup.rawValue
        self.order = order
    }
}

@Model
final class WorkoutSet {
    var setNumber: Int
    var weight: Double
    var reps: Int
    var isCompleted: Bool
    var workoutExercise: WorkoutExercise?

    init(setNumber: Int, weight: Double = 0, reps: Int = 0, isCompleted: Bool = false) {
        self.setNumber = setNumber
        self.weight = weight
        self.reps = reps
        self.isCompleted = isCompleted
    }
}
