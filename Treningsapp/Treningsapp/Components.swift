import SwiftUI

struct MuscleTag: View {
    @Environment(\.colorScheme) private var scheme
    let muscle: MuscleGroup

    var body: some View {
        Text(muscle.rawValue)
            .font(.system(size: 11, weight: .semibold))
            .foregroundStyle(Theme.Palette.accent(scheme))
            .padding(.horizontal, 8)
            .padding(.vertical, 3)
            .background(Theme.Palette.accentBg(scheme))
            .clipShape(RoundedRectangle(cornerRadius: Theme.Radius.muscleTag, style: .continuous))
    }
}

struct Card<Content: View>: View {
    @Environment(\.colorScheme) private var scheme
    var padding: CGFloat = Theme.Spacing.cardPadding
    @ViewBuilder var content: Content

    var body: some View {
        content
            .padding(padding)
            .background(Theme.Palette.surface(scheme))
            .clipShape(RoundedRectangle(cornerRadius: Theme.Radius.card, style: .continuous))
    }
}

struct SectionHeader: View {
    @Environment(\.colorScheme) private var scheme
    let title: String

    var body: some View {
        Text(title.uppercased())
            .font(Theme.Typography.sectionTitle)
            .tracking(0.6)
            .foregroundStyle(Theme.Palette.textSec(scheme))
    }
}

struct Chevron: View {
    @Environment(\.colorScheme) private var scheme

    var body: some View {
        Image(systemName: "chevron.right")
            .font(.system(size: 13, weight: .semibold))
            .foregroundStyle(Theme.Palette.textTer(scheme))
    }
}

struct ListRowSeparator: View {
    @Environment(\.colorScheme) private var scheme
    var body: some View {
        Theme.Palette.sep(scheme)
            .frame(height: 0.5)
    }
}
