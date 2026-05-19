import SwiftUI

enum Theme {

    enum Palette {
        static func bg(_ scheme: ColorScheme) -> Color {
            scheme == .dark ? Color(hex: 0x000000) : Color(hex: 0xF2F2F7)
        }
        static func surface(_ scheme: ColorScheme) -> Color {
            scheme == .dark ? Color(hex: 0x1C1C1E) : Color(hex: 0xFFFFFF)
        }
        static func text(_ scheme: ColorScheme) -> Color {
            scheme == .dark ? Color(hex: 0xF5F5F7) : Color(hex: 0x1D1D1F)
        }
        static func textSec(_ scheme: ColorScheme) -> Color {
            scheme == .dark
                ? Color(red: 235/255, green: 235/255, blue: 245/255, opacity: 0.6)
                : Color(red: 60/255, green: 60/255, blue: 67/255, opacity: 0.6)
        }
        static func textTer(_ scheme: ColorScheme) -> Color {
            scheme == .dark
                ? Color(red: 235/255, green: 235/255, blue: 245/255, opacity: 0.3)
                : Color(red: 60/255, green: 60/255, blue: 67/255, opacity: 0.3)
        }
        static func sep(_ scheme: ColorScheme) -> Color {
            scheme == .dark
                ? Color(red: 84/255, green: 84/255, blue: 88/255, opacity: 0.34)
                : Color(red: 60/255, green: 60/255, blue: 67/255, opacity: 0.12)
        }
        static func accent(_ scheme: ColorScheme) -> Color {
            scheme == .dark ? Color(hex: 0x3B82F6) : Color(hex: 0x2563EB)
        }
        static func accentBg(_ scheme: ColorScheme) -> Color {
            scheme == .dark ? Color(hex: 0x172554) : Color(hex: 0xEBF2FF)
        }
        static func tabBg(_ scheme: ColorScheme) -> Color {
            scheme == .dark
                ? Color(red: 30/255, green: 30/255, blue: 30/255, opacity: 0.92)
                : Color(red: 249/255, green: 249/255, blue: 249/255, opacity: 0.92)
        }
    }

    enum Typography {
        static let largeTitle = Font.system(size: 34, weight: .bold)
        static let sectionTitle = Font.system(size: 13, weight: .semibold)
        static let cardTitle = Font.system(size: 16, weight: .semibold)
        static let body = Font.system(size: 16, weight: .regular)
        static let secondary = Font.system(size: 14, weight: .regular)
        static let small = Font.system(size: 13, weight: .regular)
        static let label = Font.system(size: 12, weight: .medium)
        static let tabLabel = Font.system(size: 10, weight: .medium)
        static let bigNumber = Font.system(size: 28, weight: .bold).monospacedDigit()
        static let timer = Font.system(size: 54, weight: .ultraLight).monospacedDigit()
    }

    enum Spacing {
        static let screenH: CGFloat = 24
        static let cardPadding: CGFloat = 16
        static let sectionGap: CGFloat = 28
        static let cardGap: CGFloat = 12
    }

    enum Radius {
        static let card: CGFloat = 14
        static let chip: CGFloat = 20
        static let button: CGFloat = 14
        static let search: CGFloat = 12
        static let muscleTag: CGFloat = 6
    }
}

extension Color {
    init(hex: UInt32, opacity: Double = 1.0) {
        let r = Double((hex >> 16) & 0xFF) / 255
        let g = Double((hex >> 8) & 0xFF) / 255
        let b = Double(hex & 0xFF) / 255
        self.init(.sRGB, red: r, green: g, blue: b, opacity: opacity)
    }
}
