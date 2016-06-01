package com.taskwc2;

import android.content.DialogInterface;
import android.content.Intent;
import android.os.Bundle;
import android.text.TextUtils;

import com.facebook.react.ReactActivity;
import com.facebook.react.ReactPackage;
import com.facebook.react.shell.MainReactPackage;
import com.taskwc2.controller.data.AccountController;
import com.taskwc2.controller.data.Controller;
import com.taskwc2.react.TwModule;

import org.kvj.bravo7.form.FormController;
import org.kvj.bravo7.form.impl.ViewFinder;
import org.kvj.bravo7.form.impl.bundle.StringBundleAdapter;
import org.kvj.bravo7.form.impl.widget.TransientAdapter;
import org.kvj.bravo7.widget.Dialogs;

import java.util.ArrayList;
import java.util.List;

public class MainActivity extends ReactActivity {

    Controller controller = App.controller();
    FormController form = new FormController(new ViewFinder.ActivityViewFinder(this));

    /**
     * Returns the name of the main component registered from JavaScript.
     * This is used to schedule rendering of the component.
     */
    @Override
    protected String getMainComponentName() {
        return "taskwc2";
    }

    /**
     * Returns whether dev mode should be enabled.
     * This enables e.g. the dev menu.
     */
    @Override
    protected boolean getUseDeveloperSupport() {
        return BuildConfig.DEBUG;
    }

    /**
     * A list of packages used by the app. If the app uses additional views
     * or modules besides the default ones, add more packages here.
     */
    @Override
    protected List<ReactPackage> getPackages() {
        AccountController acc = controller.accountController(form, false);
        List<ReactPackage> list = new ArrayList<>();
        list.add(new MainReactPackage());
        if (null == acc) { // Ask about new profile
            Dialogs.questionDialog(this, "New Profile", "Create new Profile?", new Dialogs.Callback<Void>() {
                @Override
                public void run(Void data) {
                    String message = controller.createAccount(null); // Random
                    if (!TextUtils.isEmpty(message)) { // Error
                        controller.messageLong(message);
                    } else {
                        startActivity(new Intent(MainActivity.this, MainActivity.class));
                    }
                }
            }).setOnDismissListener(new DialogInterface.OnDismissListener() {
                @Override
                public void onDismiss(DialogInterface dialog) {
                    finish();
                }
            });
        }
        list.add(new TwModule.TwPackage(acc));
        return list;
    }

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        form.add(new TransientAdapter<>(new StringBundleAdapter(), controller.defaultAccount()), App.KEY_ACCOUNT);
        form.load(this, savedInstanceState);
        super.onCreate(savedInstanceState);
    }
}
