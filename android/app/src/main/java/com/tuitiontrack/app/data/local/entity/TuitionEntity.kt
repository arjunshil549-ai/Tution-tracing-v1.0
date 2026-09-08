package com.tuitiontrack.app.data.local.entity

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "tuitions")
data class TuitionEntity(
    @PrimaryKey
    val id: Long,
    val name: String,
    val studentName: String? = null,
    val address: String,
    val latitude: Double,
    val longitude: Double,
    val radiusMeters: Float = 100f,
    val expectedStartTime: String, // "16:00"
    val expectedEndTime: String,   // "18:00"
    val fee: Double = 0.0,
    val expectedMonthlyClasses: Int = 10,
    val scheduledDays: String = "[]", // JSON string e.g. "[1,3,5]"
    val minimumStayMinutes: Int = 30,
    val isActive: Boolean = true,
    val createdAt: Long = System.currentTimeMillis(),
    val updatedAt: Long = System.currentTimeMillis()
)
