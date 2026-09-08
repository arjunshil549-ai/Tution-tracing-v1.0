package com.tuitiontrack.app.data.local.entity

enum class SyncStatus {
    PENDING,
    SYNCED,
    FAILED
}

enum class AttendanceStatus {
    IN_PROGRESS,
    COMPLETED,
    INVALID,
    CANCELLED
}

enum class AttendanceSource {
    GEOFENCE,
    MANUAL
}
