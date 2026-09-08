package com.tuitiontrack.app.data.local.entity

import androidx.room.Entity
import androidx.room.ForeignKey
import androidx.room.Index
import androidx.room.PrimaryKey
import java.util.UUID

@Entity(
    tableName = "attendance",
    foreignKeys = [
        ForeignKey(
            entity = TuitionEntity::class,
            parentColumns = ["id"],
            childColumns = ["tuitionId"],
            onDelete = ForeignKey.SET_NULL
        )
    ],
    indices = [
        Index(value = ["tuitionId"]),
        Index(value = ["date"]),
        Index(value = ["clientEventId"], unique = true),
        Index(value = ["syncStatus"])
    ]
)
data class AttendanceEntity(
    @PrimaryKey(autoGenerate = true)
    val id: Long = 0,
    val tuitionId: Long?,
    val date: String, // YYYY-MM-DD
    val arrivalTime: Long, // timestamp in millis
    val departureTime: Long? = null,
    val durationSeconds: Long = 0,
    val status: String = AttendanceStatus.COMPLETED.name,
    val source: String = AttendanceSource.GEOFENCE.name,
    val notes: String? = null,
    val arrivalLatitude: Double? = null,
    val arrivalLongitude: Double? = null,
    val arrivalAccuracy: Double? = null,
    val departureLatitude: Double? = null,
    val departureLongitude: Double? = null,
    val departureAccuracy: Double? = null,
    val syncStatus: String = SyncStatus.PENDING.name,
    val clientEventId: String = UUID.randomUUID().toString(),
    val createdAt: Long = System.currentTimeMillis()
)
