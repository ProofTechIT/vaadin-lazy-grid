import java.io.InputStream;
import java.util.logging.Level;
import java.util.logging.LogManager;

public class LoggingConfig {
	public LoggingConfig() {
		try {
			System.out.println("!!!!!!!!!!!!!!!!!!");
			// Load a properties file from class path that way can't be achieved
			// with java.util.logging.config.file
			/*
			 * final LogManager logManager = LogManager.getLogManager(); try
			 * (final InputStream is =
			 * getClass().getResourceAsStream("/logging.properties")) {
			 * logManager.readConfiguration(is); }
			 */

			final LogManager logManager = LogManager.getLogManager();
			try (final InputStream is = getClass().getResourceAsStream("/logging.properties")) {
				System.out.println("111");
				logManager.readConfiguration(is);
			}
			//LogManager.getLogManager().getLogger("com.prooftechit").setLevel(Level.FINE);
			// Programmatic configuration
			 System.setProperty("java.util.logging.SimpleFormatter.format",
			 "%1$tY-%1$tm-%1$td %1$tH:%1$tM:%1$tS.%1$tL %4$-7s [%3$s] %5$s %6$s%n");

			// final ConsoleHandler consoleHandler = new ConsoleHandler();
			// consoleHandler.setLevel(Level.FINEST);
			// consoleHandler.setFormatter(new SimpleFormatter());
			//
			// final Logger app = Logger.getLogger("com.prooftechit.vaadin");
			// app.setLevel(Level.FINEST);
			// app.addHandler(consoleHandler);
		} catch (Exception e) {
			// The runtime won't show stack traces if the exception is thrown
			e.printStackTrace();
		}
	}
}
