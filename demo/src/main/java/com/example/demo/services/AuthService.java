
import com.example.demo.dtos.AuthResponse;
import com.example.demo.dtos.GoogleLoginRequest;
import com.example.demo.dtos.LoginRequest;
import com.example.demo.dtos.RegisterRequest;
import com.example.demo.models.Candidate;
import com.example.demo.models.User;
import com.example.demo.repositories.CandidateRepository;
import com.example.demo.repositories.UserRepository;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.jackson2.JacksonFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.util.Collections;
import java.util.Collections;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final CandidateRepository candidateRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;
    private final GoogleIdTokenVerifier verifier;

    public AuthService(UserRepository userRepository, CandidateRepository candidateRepository, PasswordEncoder passwordEncoder, JwtService jwtService, AuthenticationManager authenticationManager, @Value("${spring.security.oauth2.client.registration.google.client-id}") String clientId) {
        this.userRepository = userRepository;
        this.candidateRepository = candidateRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.authenticationManager = authenticationManager;
        this.verifier = new GoogleIdTokenVerifier.Builder(new NetHttpTransport(), JacksonFactory.getDefaultInstance())
                .setAudience(Collections.singletonList(clientId))
                .build();
    }

    public AuthResponse register(RegisterRequest registerRequest) {
        var user = User.builder()
                .email(registerRequest.getEmail())
                .password(passwordEncoder.encode(registerRequest.getPassword()))
                .provider(User.AuthProvider.LOCAL)
                .roles(new User.Roles(true, false))
                .build();
        userRepository.save(user);
        var jwtToken = jwtService.generateToken(user);
        return new AuthResponse(user, jwtToken);
    }

    public AuthResponse login(LoginRequest loginRequest) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        loginRequest.getEmail(),
                        loginRequest.getPassword()
                )
        );
        var user = userRepository.findByEmail(loginRequest.getEmail())
                .orElseThrow();
        var jwtToken = jwtService.generateToken(user);
        return new AuthResponse(user, jwtToken);
    }

    public AuthResponse googleLogin(GoogleLoginRequest googleLoginRequest) throws IOException {
        GoogleIdToken idToken = verifier.verify(googleLoginRequest.getIdToken());
        if (idToken == null) {
            throw new IllegalArgumentException("Invalid ID token");
        }
        GoogleIdToken.Payload payload = idToken.getPayload();
        String email = payload.getEmail();
        User user = userRepository.findByEmail(email)
                .orElseGet(() -> {
                    User newUser = User.builder()
                            .email(email)
                            .provider(User.AuthProvider.GOOGLE)
                            .providerId(payload.getSubject())
                            .roles(new User.Roles(true, false))
                            .build();
                    userRepository.save(newUser);
                    Candidate candidate = Candidate.builder()
                            .user(newUser)
                            .fullName((String) payload.get("name"))
                            .build();
                    candidateRepository.save(candidate);
                    return newUser;
                });
        var jwtToken = jwtService.generateToken(user);
        return new AuthResponse(user, jwtToken);
    }
}
