package com.incidentflow.incidentflow.incident.controller;
import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import jakarta.servlet.http.HttpSession;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "http://127.0.0.1:5500", allowCredentials = "true")
public class AuthController {

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> body, HttpSession session) {
        String role = body.getOrDefault("role", "").trim().toUpperCase();

        if (role.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Role is required"));
        }

        if (!role.equals("ADMIN") && !role.equals("SUPPORT") && !role.equals("EMPLOYEE")) {
            return ResponseEntity.badRequest().body(Map.of("error", "Invalid role"));
        }

        session.setAttribute("USER_ROLE", role);
        return ResponseEntity.ok(Map.of("message", "Logged in", "role", role));
    }

    @PostMapping("/logout")
    public ResponseEntity<?> logout(HttpSession session) {
        session.invalidate();
        return ResponseEntity.ok(Map.of("message", "Logged out"));
    }

    @GetMapping("/me")
    public ResponseEntity<?> me(HttpSession session) {
        Object role = session.getAttribute("USER_ROLE");
        if (role == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Not logged in"));
        }
        return ResponseEntity.ok(Map.of("role", role.toString()));
    }
}