class Rack::Attack
  # Throttle API requests by IP (300 requests per 5 minutes)
  throttle("api/ip", limit: 300, period: 5.minutes) do |req|
    req.ip if req.path.start_with?("/api/")
  end

  # Throttle login attempts by IP (5 attempts per 20 seconds)
  throttle("logins/ip", limit: 5, period: 20.seconds) do |req|
    req.ip if req.path == "/api/v1/users/sign_in" && req.post?
  end

  # Throttle login attempts by email (5 attempts per 2 minutes)
  throttle("logins/email", limit: 5, period: 2.minutes) do |req|
    if req.path == "/api/v1/users/sign_in" && req.post?
      req.params.dig("user", "email")&.downcase&.strip
    end
  end

  # Return JSON response for throttled requests
  self.throttled_responder = lambda do |req|
    retry_after = (req.env["rack.attack.match_data"] || {})[:period]
    [
      429,
      { "Content-Type" => "application/json", "Retry-After" => retry_after.to_s },
      [{ error: "Rate limit exceeded. Try again in #{retry_after} seconds." }.to_json]
    ]
  end
end
